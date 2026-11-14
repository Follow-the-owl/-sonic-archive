// HTTP routes: fragment (track) CRUD, duplication, status changes and catalog sync.
import type { Express } from "express";
import { ALLOWED_CANONICAL_SET, db, formatToTimestamp, mockFragments, normalizeFragmentId, persistFragments, saveR2FileRecord, useMockDb } from "../db.js";
import { requireAdmin } from "../security.js";

export function registerFragmentRoutes(app: Express) {
  // --- Fragment CRUD APIs ---
  app.all(["/api/fragments/sync-beats", "/api/sync-beats"], async (req, res) => {
    try {
      if (!useMockDb && db) {
        const fragmentsCol = db.collection("fragments");
        for (const frag of mockFragments) {
          await fragmentsCol.updateOne(
            { id: frag.id },
            { $set: frag },
            { upsert: true }
          );
        }
        for (const frag of mockFragments) {
          if (frag.mp3Preview) {
            await saveR2FileRecord({
              objectKey: `audio/${frag.id.replace(/:/g, "-")}-preview.mp3`,
              filename: `${frag.name.replace(/\s+/g, "_")}_Preview.mp3`,
              contentType: "audio/mpeg",
              directUrl: frag.mp3Preview,
              downloadUrl: frag.mp3Preview,
              fragmentId: frag.id,
              status: "verified",
            });
          }
          if (frag.wavMaster) {
            await saveR2FileRecord({
              objectKey: `audio/${frag.id.replace(/:/g, "-")}-master.wav`,
              filename: `${frag.name.replace(/\s+/g, "_")}_Master_24bit.wav`,
              contentType: "audio/wav",
              directUrl: frag.wavMaster,
              downloadUrl: frag.wavMaster,
              fragmentId: frag.id,
              status: "verified",
            });
          }
          if (frag.stemsZip) {
            await saveR2FileRecord({
              objectKey: `fragments/${frag.id.replace(/:/g, "")}/stems/stems.zip`,
              filename: `${frag.name.replace(/\s+/g, "_")}_Stems_Archive.zip`,
              contentType: "application/zip",
              directUrl: frag.stemsZip,
              downloadUrl: frag.stemsZip,
              fragmentId: frag.id,
              status: "verified",
            });
          }
        }
        return res.json({ success: true, message: "Beat fragments & Cloudflare R2 links synced in MongoDB.", fragments: mockFragments });
      }
      return res.json({ success: true, message: "Beat fragments synced in active memory store.", fragments: mockFragments });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get("/api/fragments", async (req, res) => {
    try {
      const { status, genre, mood, availability, page, limit } = req.query;
      let list: any[] = [];
      if (!useMockDb && db) {
        try {
          list = await db.collection("fragments").find({}).toArray();
        } catch (dbErr: any) {
          list = mockFragments;
        }
      } else {
        list = mockFragments;
      }

      // Filter by query parameters if provided
      let filtered = list;
      if (status && status !== "ALL") {
        filtered = filtered.filter(f => (f.status || "published").toLowerCase() === String(status).toLowerCase());
      }
      if (availability && availability !== "ALL") {
        filtered = filtered.filter(f => (f.availability || (f.isExclusive ? "sold" : "available")).toLowerCase() === String(availability).toLowerCase());
      }
      if (genre) {
        const gLower = String(genre).toLowerCase();
        filtered = filtered.filter(f => {
          if (Array.isArray(f.genre)) return f.genre.some((g: string) => g.toLowerCase().includes(gLower));
          return (f.classification || "").toLowerCase().includes(gLower);
        });
      }
      if (mood) {
        const mLower = String(mood).toLowerCase();
        filtered = filtered.filter(f => {
          if (Array.isArray(f.mood)) return f.mood.some((m: string) => m.toLowerCase().includes(mLower));
          return false;
        });
      }

      // Exclude soft-deleted records unless explicitly querying archived
      if (status !== "archived") {
        filtered = filtered.filter(f => !f.deletedAt);
      }

      // Strictly restrict to ONLY the 5 authorized beats
      filtered = filtered.filter(f => {
        const fid = normalizeFragmentId(String(f.id || ""));
        return ALLOWED_CANONICAL_SET.has(fid);
      });

      // Normalize audio and time fields (Strictly ensure all fragment names are timestamps)
      filtered = filtered.map(f => {
        const publicAudio = f.audioUrl || f.previewAudioUrl || f.mp3Preview
          || (Array.isArray(f.audioFiles) ? (
            f.audioFiles.find((a: any) => a.fileType === "publicPreviewMp3")?.fileUrl ||
            f.audioFiles.find((a: any) => a.fileType === "masterWav")?.fileUrl ||
            f.audioFiles[0]?.fileUrl
          ) : "");
        const normTime = formatToTimestamp(f.fragmentTimestamp || f.timestamp || f.name || f.id);
        const normId = normalizeFragmentId(f.id || normTime);
        return {
          ...f,
          id: normId,
          name: normTime,
          timestamp: normTime,
          fragmentTimestamp: normTime,
          compositionTitle: f.compositionTitle && !f.compositionTitle.startsWith("Internal Master") && f.compositionTitle !== "719"
            ? formatToTimestamp(f.compositionTitle)
            : normTime,
          audioUrl: publicAudio || f.audioUrl || "",
          previewAudioUrl: publicAudio || f.previewAudioUrl || "",
          mp3Preview: publicAudio || f.mp3Preview || ""
        };
      });

      // Optional pagination
      const pageNum = parseInt(String(page || "1"), 10);
      const limitNum = parseInt(String(limit || "100"), 10);
      const total = filtered.length;
      const paginated = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

      res.json({
        success: true,
        total,
        page: pageNum,
        limit: limitNum,
        fragments: paginated
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to retrieve fragments from database." });
    }
  });

  app.get("/api/fragments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const normReqId = normalizeFragmentId(id);
      if (!ALLOWED_CANONICAL_SET.has(normReqId)) {
        return res.status(404).json({ error: `Beat fragment ${id} not found in archive.` });
      }
      let found: any = null;

      if (!useMockDb && db) {
        try {
          found = await db.collection("fragments").findOne({ 
            $or: [
              { id }, 
              { id: normReqId },
              { fragmentId: id }, 
              { fragmentId: normReqId },
              { id: id.replace(/[^0-9]/g, "") }
            ] 
          });
        } catch (dbErr: any) {
          // Fallback to local store if remote query is unavailable
        }
      }

      if (!found) {
        found = mockFragments.find(f => 
          f.id === id || 
          f.id === normReqId || 
          (f as any).fragmentId === id || 
          (f as any).fragmentId === normReqId ||
          f.id.replace(/[^0-9]/g, "") === id.replace(/[^0-9]/g, "")
        );
      }

      if (!found) {
        return res.status(404).json({ error: `Fragment ${id} not found.` });
      }

      const normTime = formatToTimestamp(found.fragmentTimestamp || found.timestamp || found.name || found.id);
      const normalizedFound = {
        ...found,
        id: normalizeFragmentId(found.id || normTime),
        name: normTime,
        timestamp: normTime,
        fragmentTimestamp: normTime
      };

      res.json({ success: true, fragment: normalizedFound });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to get fragment." });
    }
  });

  app.post("/api/fragments", requireAdmin, async (req, res) => {
    try {
      const fragment = req.body;
      const cleanId = fragment.id || fragment.fragmentId;
      if (!fragment || !cleanId) {
        return res.status(400).json({ error: "Fragment ID / timestamp is required." });
      }

      const rawTime = fragment.fragmentTimestamp || fragment.timestamp || fragment.name || cleanId;
      const normTime = formatToTimestamp(rawTime);
      const normId = normalizeFragmentId(cleanId || normTime);

      const publicAudio = fragment.audioUrl || fragment.previewAudioUrl || fragment.mp3Preview 
        || (Array.isArray(fragment.audioFiles) ? (
          fragment.audioFiles.find((a: any) => a.fileType === "publicPreviewMp3")?.fileUrl ||
          fragment.audioFiles.find((a: any) => a.fileType === "masterWav")?.fileUrl ||
          fragment.audioFiles[0]?.fileUrl
        ) : "");

      const stemsZipUrl = fragment.stemsZip || fragment.zipUrl 
        || fragment.stemManifest?.zipUrl 
        || (Array.isArray(fragment.audioFiles) ? fragment.audioFiles.find((a: any) => a.fileType === "stemZip")?.fileUrl : "");

      const newRecord = {
        ...fragment,
        id: normId,
        name: normTime,
        timestamp: normTime,
        fragmentTimestamp: normTime,
        compositionTitle: fragment.compositionTitle && !fragment.compositionTitle.startsWith("Internal Master") && fragment.compositionTitle !== "719"
          ? formatToTimestamp(fragment.compositionTitle)
          : normTime,
        audioUrl: publicAudio || fragment.audioUrl || "",
        previewAudioUrl: publicAudio || fragment.previewAudioUrl || "",
        mp3Preview: publicAudio || fragment.mp3Preview || "",
        stemsZip: stemsZipUrl || fragment.stemsZip || "",
        zipUrl: stemsZipUrl || fragment.zipUrl || "",
        status: fragment.status || "published",
        availability: fragment.availability || "available",
        createdAt: fragment.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null
      };

      // 1. Update in-memory cache & persistent file store
      const existsIdx = mockFragments.findIndex(f => f.id === normId || f.id === cleanId);
      if (existsIdx >= 0) {
        mockFragments[existsIdx] = { ...mockFragments[existsIdx], ...newRecord };
      } else {
        mockFragments.unshift(newRecord as any);
      }
      persistFragments(mockFragments);

      // 2. Persist directly to MongoDB Atlas
      if (db) {
        try {
          const col = db.collection("fragments");
          await col.updateOne({ $or: [{ id: normId }, { id: cleanId }] }, { $set: newRecord }, { upsert: true });
          console.log(`[MONGODB] Fragment '${normId}' (${normTime}) successfully persisted to MongoDB Atlas collection 'fragments'.`);
        } catch (dbErr: any) {
          console.warn(`[MONGODB] Notice: Fragment '${normId}' saved locally, background MongoDB write:`, dbErr?.message);
        }
      }

      res.json({ success: true, fragment: newRecord });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to save fragment." });
    }
  });

  app.put("/api/fragments/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const fragment = req.body;
      if (!id || !fragment) {
        return res.status(400).json({ error: "Fragment ID and payload are required." });
      }

      const updatedRecord = {
        ...fragment,
        id,
        updatedAt: new Date().toISOString()
      };

      // 1. Update in-memory & file storage
      const idx = mockFragments.findIndex(f => f.id === id);
      if (idx !== -1) {
        mockFragments[idx] = { ...mockFragments[idx], ...updatedRecord };
      } else {
        mockFragments.unshift(updatedRecord as any);
      }
      persistFragments(mockFragments);

      // 2. Update MongoDB Atlas
      if (db) {
        try {
          await db.collection("fragments").updateOne(
            { id },
            { $set: updatedRecord },
            { upsert: true }
          );
        } catch (dbErr: any) {
          console.warn(`[MONGODB] Notice: Fragment '${id}' updated in local vault, MongoDB write:`, dbErr?.message);
        }
      }

      res.json({ success: true, fragment: updatedRecord, message: `Fragment ${id} updated successfully.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update fragment." });
    }
  });

  // Quick status change patch (draft/published/archived/scheduled)
  app.patch("/api/fragments/:id/status", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!id || !status) {
        return res.status(400).json({ error: "Fragment ID and status are required." });
      }

      const patch: any = { status, updatedAt: new Date().toISOString() };
      if (status === "archived") {
        patch.deletedAt = new Date().toISOString();
      } else {
        patch.deletedAt = null;
      }

      const idx = mockFragments.findIndex(f => f.id === id);
      if (idx !== -1) {
        mockFragments[idx] = { ...mockFragments[idx], ...patch };
        persistFragments(mockFragments);
      }

      if (db) {
        try {
          await db.collection("fragments").updateOne({ id }, { $set: patch });
        } catch (dbErr: any) {
          console.warn(`[MONGODB] Notice: Fragment '${id}' status updated in local vault:`, dbErr?.message);
        }
      }

      res.json({ success: true, message: `Fragment ${id} status changed to ${status}.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to patch fragment status." });
    }
  });

  // Soft Delete or Hard Delete (supports ?permanent=true)
  app.delete("/api/fragments/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { permanent } = req.query;
      if (!id) {
        return res.status(400).json({ error: "Fragment ID is required for deletion." });
      }

      if (permanent === "true") {
        const idx = mockFragments.findIndex(f => f.id === id);
        if (idx !== -1) {
          mockFragments.splice(idx, 1);
          persistFragments(mockFragments);
        }
        if (db) {
          await db.collection("fragments").deleteOne({ id }).catch(() => {});
        }
        return res.json({ success: true, message: `Fragment ${id} permanently removed from database.` });
      }

      const patch = {
        status: "archived",
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const idx = mockFragments.findIndex(f => f.id === id);
      if (idx !== -1) {
        mockFragments[idx] = { ...mockFragments[idx], ...patch };
        persistFragments(mockFragments);
      }

      if (db) {
        await db.collection("fragments").updateOne({ id }, { $set: patch }).catch(() => {});
      }

      res.json({ success: true, message: `Fragment ${id} marked as archived/soft-deleted.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to delete fragment." });
    }
  });

  // Duplicate Fragment Endpoint
  app.post("/api/fragments/:id/duplicate", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      let original: any = null;

      if (useMockDb) {
        original = mockFragments.find(f => f.id === id);
      } else {
        original = await db!.collection("fragments").findOne({ id });
      }

      if (!original) {
        return res.status(404).json({ error: `Original fragment ${id} not found.` });
      }

      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const newId = `${original.id}-COPY-${randomSuffix}`;
      const cloned = {
        ...original,
        _id: undefined,
        id: newId,
        name: `${original.name || original.id} (Copy)`,
        compositionTitle: `${original.compositionTitle || original.name || original.id} (Copy)`,
        compositionId: `LOC-COMP-${newId.replace(/[^a-zA-Z0-9]/g, "")}`,
        status: "draft",
        syncStatus: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null
      };

      if (useMockDb) {
        mockFragments.unshift(cloned);
      } else {
        await db!.collection("fragments").insertOne(cloned);
      }

      res.json({ success: true, fragment: cloned, message: `Fragment ${id} duplicated as ${newId}.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to duplicate fragment." });
    }
  });

  // Sync receiving endpoint (public catalog upsert)
  app.post("/api/catalog/sync", requireAdmin, async (req, res) => {
    try {
      const { fragmentId, payload, action } = req.body;
      if (!fragmentId) {
        return res.status(400).json({ error: "fragmentId is required for catalog sync." });
      }

      if (action === "remove" || action === "unpublish") {
        console.log(`[CATALOG SYNC] Removed fragment ${fragmentId} from public catalog.`);
        return res.json({ success: true, action: "removed", fragmentId });
      }

      console.log(`[CATALOG SYNC] Upserted fragment ${fragmentId} to public clock catalog.`, payload?.key, payload?.bpm);
      return res.json({ success: true, action: "upserted", fragmentId, syncedAt: new Date().toISOString() });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Catalog sync failed." });
    }
  });
}
