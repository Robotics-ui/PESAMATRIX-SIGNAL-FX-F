import * as React from 'react';
import {
  Upload, Trash2, Pencil, Image, Film, File, Grid3X3, List,
  X, Eye, AlertCircle, FolderOpen, CheckCircle, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose,
} from '../components/ui/dialog';
import { useToast } from '../components/ToastProvider';
import {
  useGetMedia, useDeleteMedia, useUpdateMediaMetadata,
  apiUpload, type MediaItem, type MediaMetadataUpdate,
  useAuthUser,
} from '../api/client';
import DashboardLayout from '../layouts/DashboardLayout';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isImage(mimeType: string) { return mimeType.startsWith('image/'); }
function isVideo(mimeType: string) { return mimeType.startsWith('video/'); }

function MediaTypeIcon({ mimeType, className = 'h-5 w-5' }: { mimeType: string; className?: string }) {
  if (isImage(mimeType)) return <Image className={`${className} text-purple-400`} />;
  if (isVideo(mimeType)) return <Film className={`${className} text-blue-400`} />;
  return <File className={`${className} text-zinc-400`} />;
}

function MediaTypeBadge({ mimeType }: { mimeType: string }) {
  if (isImage(mimeType)) return <Badge variant="info">Image</Badge>;
  if (isVideo(mimeType)) return <Badge variant="warning">Video</Badge>;
  return <Badge>File</Badge>;
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────
function UploadZone({ onUploaded }: { onUploaded: () => void }) {
  const { toast } = useToast();
  const [dragging, setDragging] = React.useState(false);
  const [uploads, setUploads] = React.useState<
    { name: string; progress: number; status: 'uploading' | 'done' | 'error'; error?: string }[]
  >([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    const startIdx = uploads.length;
    setUploads(prev => [...prev, ...fileArray.map(f => ({ name: f.name, progress: 0, status: 'uploading' as const }))]);

    await Promise.all(
      fileArray.map(async (file, i) => {
        const idx = startIdx + i;
        try {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('title', file.name);
          await apiUpload('/media/upload', fd, (pct) => {
            setUploads(prev => prev.map((u, j) => j === idx ? { ...u, progress: pct } : u));
          });
          setUploads(prev => prev.map((u, j) => j === idx ? { ...u, status: 'done', progress: 100 } : u));
          toast(`"${file.name}" uploaded successfully`, 'success');
          onUploaded();
        } catch (err: any) {
          setUploads(prev => prev.map((u, j) => j === idx ? { ...u, status: 'error', error: err.message } : u));
          toast(`Failed to upload "${file.name}": ${err.message}`, 'error');
        }
      })
    );
  }

  return (
    <div className="space-y-3">
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
          dragging ? 'border-purple-500 bg-purple-500/5' : 'border-zinc-800 hover:border-zinc-600 bg-zinc-950/60'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      >
        <Upload className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
        <p className="text-sm font-medium text-zinc-300">Drop files here or <span className="text-purple-400">browse</span></p>
        <p className="text-xs text-zinc-500 mt-1">Supports images, videos, and documents</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          accept="image/*,video/*,.pdf,.doc,.docx"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>
      {uploads.length > 0 && (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {uploads.map((u, i) => (
            <div key={i} className="flex items-center gap-3 bg-zinc-900/60 rounded-lg px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-300 truncate">{u.name}</p>
                {u.status === 'uploading' && (
                  <div className="mt-1.5 h-1 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${u.progress}%` }} />
                  </div>
                )}
                {u.status === 'error' && <p className="text-[10px] text-red-400 mt-0.5">{u.error}</p>}
              </div>
              {u.status === 'uploading' && <Loader2 className="h-3.5 w-3.5 text-purple-400 animate-spin shrink-0" />}
              {u.status === 'done' && <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
              {u.status === 'error' && <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Preview Dialog ───────────────────────────────────────────────────────────
function PreviewDialog({ item, onClose }: { item: MediaItem | null; onClose: () => void }) {
  return (
    <Dialog open={!!item} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{item?.title || item?.originalName || 'Preview'}</DialogTitle>
          <DialogDescription>
            {item ? `${formatBytes(item.size)} · Uploaded ${formatDate(item.createdAt)}` : ''}
          </DialogDescription>
        </DialogHeader>
        {item && (
          <div className="flex items-center justify-center bg-zinc-900 rounded-lg overflow-hidden min-h-[200px] max-h-[500px]">
            {isImage(item.mimeType) && (
              <img src={item.url} alt={item.title || item.originalName} className="max-w-full max-h-[500px] object-contain" />
            )}
            {isVideo(item.mimeType) && (
              <video src={item.url} controls className="max-w-full max-h-[500px]" />
            )}
            {!isImage(item.mimeType) && !isVideo(item.mimeType) && (
              <div className="flex flex-col items-center gap-3 py-12">
                <File className="h-16 w-16 text-zinc-600" />
                <p className="text-sm text-zinc-400">{item.mimeType}</p>
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" className="text-xs">Download File</Button>
                </a>
              </div>
            )}
          </div>
        )}
        {item?.description && <p className="text-sm text-zinc-400 mt-2">{item.description}</p>}
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Dialog ──────────────────────────────────────────────────────────────
function EditDialog({ item, onClose }: { item: MediaItem | null; onClose: () => void }) {
  const { toast } = useToast();
  const updateMutation = useUpdateMediaMetadata();
  const [form, setForm] = React.useState<MediaMetadataUpdate>({ title: '', description: '' });

  React.useEffect(() => {
    if (item) setForm({ title: item.title || '', description: item.description || '' });
  }, [item]);

  async function handleSave() {
    if (!item) return;
    try {
      await updateMutation.mutateAsync({ id: item.id, data: form });
      toast('Media metadata updated', 'success');
      onClose();
    } catch (err: any) {
      toast(err.message || 'Failed to update metadata', 'error');
    }
  }

  return (
    <Dialog open={!!item} onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Media Details</DialogTitle>
          <DialogDescription>Update the title and description for this file.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5">Title</label>
            <input
              type="text"
              value={form.title || ''}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Enter a title..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-zinc-600"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5">Description</label>
            <textarea
              value={form.description || ''}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Add a description..."
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-zinc-600 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <DialogClose asChild>
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</>
              ) : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Dialog ─────────────────────────────────────────────────────────────
function DeleteDialog({ item, onClose }: { item: MediaItem | null; onClose: () => void }) {
  const { toast } = useToast();
  const deleteMutation = useDeleteMedia();

  async function handleDelete() {
    if (!item) return;
    try {
      await deleteMutation.mutateAsync(item.id);
      toast(`"${item.title || item.originalName}" deleted`, 'success');
      onClose();
    } catch (err: any) {
      toast(err.message || 'Failed to delete media', 'error');
    }
  }

  return (
    <Dialog open={!!item} onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Media</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{' '}
            <span className="text-zinc-200 font-medium">"{item?.title || item?.originalName}"</span>?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-3 mt-4">
          <DialogClose asChild>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Deleting…</>
            ) : 'Delete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Grid View ─────────────────────────────────────────────────────────────────
function GridView({ items, onPreview, onEdit, onDelete }: {
  items: MediaItem[];
  onPreview: (item: MediaItem) => void;
  onEdit: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {items.map(item => (
        <div key={item.id} className="group relative bg-zinc-900/60 border border-zinc-800/60 rounded-xl overflow-hidden hover:border-zinc-700 transition-all">
          <div className="aspect-square flex items-center justify-center bg-zinc-900">
            {isImage(item.mimeType) ? (
              <img src={item.thumbnailUrl || item.url} alt={item.title || item.originalName} className="w-full h-full object-cover" />
            ) : isVideo(item.mimeType) ? (
              <div className="flex flex-col items-center gap-2">
                <Film className="h-10 w-10 text-blue-400" />
                <span className="text-[10px] text-zinc-500 uppercase">Video</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <File className="h-10 w-10 text-zinc-500" />
                <span className="text-[10px] text-zinc-500 uppercase">File</span>
              </div>
            )}
          </div>
          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              onClick={() => onPreview(item)}
              className="h-8 w-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
              title="Preview"
            >
              <Eye className="h-3.5 w-3.5 text-zinc-200" />
            </button>
            <button
              onClick={() => onEdit(item)}
              className="h-8 w-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5 text-zinc-200" />
            </button>
            <button
              onClick={() => onDelete(item)}
              className="h-8 w-8 rounded-lg bg-red-900/60 hover:bg-red-800/60 flex items-center justify-center transition-colors"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-400" />
            </button>
          </div>
          <div className="p-2.5 border-t border-zinc-800/60">
            <p className="text-xs font-medium text-zinc-300 truncate">{item.title || item.originalName}</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">{formatBytes(item.size)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function MediaLibrary() {
  const { data: mediaList, isLoading, isError, refetch } = useGetMedia();
  const { data: user } = useAuthUser();

  const [view, setView] = React.useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = React.useState<'all' | 'image' | 'video' | 'file'>('all');
  const [previewItem, setPreviewItem] = React.useState<MediaItem | null>(null);
  const [editItem, setEditItem] = React.useState<MediaItem | null>(null);
  const [deleteItem, setDeleteItem] = React.useState<MediaItem | null>(null);
  const [showUpload, setShowUpload] = React.useState(false);

  const isAdmin = user?.role === 'admin';

  const filtered = React.useMemo(() => {
    const items = mediaList || [];
    if (filter === 'image') return items.filter(m => isImage(m.mimeType));
    if (filter === 'video') return items.filter(m => isVideo(m.mimeType));
    if (filter === 'file') return items.filter(m => !isImage(m.mimeType) && !isVideo(m.mimeType));
    return items;
  }, [mediaList, filter]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Media Library
              {isAdmin && <Badge variant="warning" className="text-[10px]">Admin View</Badge>}
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              {isAdmin ? 'Manage all platform media assets.' : 'Manage your uploaded files and media.'}
            </p>
          </div>
          <Button onClick={() => setShowUpload(v => !v)} className="gap-2 shrink-0">
            {showUpload ? <X className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
            {showUpload ? 'Close Upload' : 'Upload Files'}
          </Button>
        </div>

        {/* Upload Panel */}
        {showUpload && (
          <Card className="bg-[#0c0c0e]">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-zinc-300">Upload New Files</CardTitle>
            </CardHeader>
            <CardContent>
              <UploadZone onUploaded={() => refetch()} />
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Files',  value: mediaList?.length ?? 0,                                               color: 'text-zinc-100' },
            { label: 'Images',       value: mediaList?.filter(m => isImage(m.mimeType)).length ?? 0,              color: 'text-purple-400' },
            { label: 'Videos',       value: mediaList?.filter(m => isVideo(m.mimeType)).length ?? 0,              color: 'text-blue-400' },
            { label: 'Other Files',  value: mediaList?.filter(m => !isImage(m.mimeType) && !isVideo(m.mimeType)).length ?? 0, color: 'text-zinc-400' },
          ].map(s => (
            <Card key={s.label} className="bg-[#0c0c0e]">
              <CardContent className="pt-4 pb-4">
                <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters + View Toggle */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            {(['all', 'image', 'video', 'file'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                  filter === f
                    ? 'bg-purple-600 text-white'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                {f === 'all' ? 'All' : f === 'image' ? 'Images' : f === 'video' ? 'Videos' : 'Files'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setView('grid')}
              className={`p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <Card className="bg-[#0c0c0e]">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
              <p className="text-sm text-zinc-500 uppercase tracking-widest">Loading media library…</p>
            </div>
          )}
          {isError && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <AlertCircle className="h-10 w-10 text-red-400" />
              <p className="text-sm font-medium text-zinc-300">Failed to load media</p>
              <p className="text-xs text-zinc-500">Check your connection or authentication status</p>
              <Button variant="secondary" onClick={() => refetch()} className="mt-2 text-xs">Retry</Button>
            </div>
          )}
          {!isLoading && !isError && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <FolderOpen className="h-12 w-12 text-zinc-700" />
              <p className="text-sm font-medium text-zinc-300">No media found</p>
              <p className="text-xs text-zinc-500">
                {filter !== 'all' ? `No ${filter} files yet.` : 'Upload your first file to get started.'}
              </p>
              <Button onClick={() => setShowUpload(true)} className="mt-2 gap-2 text-xs">
                <Upload className="h-3.5 w-3.5" /> Upload Files
              </Button>
            </div>
          )}
          {!isLoading && !isError && filtered.length > 0 && view === 'grid' && (
            <div className="p-6">
              <GridView
                items={filtered}
                onPreview={setPreviewItem}
                onEdit={setEditItem}
                onDelete={setDeleteItem}
              />
            </div>
          )}
          {!isLoading && !isError && filtered.length > 0 && view === 'list' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  {isAdmin && <TableHead>Uploaded By</TableHead>}
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="h-9 w-9 rounded-lg bg-zinc-900 flex items-center justify-center overflow-hidden">
                        {isImage(item.mimeType) ? (
                          <img src={item.thumbnailUrl || item.url} alt="" className="h-9 w-9 object-cover rounded-lg" />
                        ) : (
                          <MediaTypeIcon mimeType={item.mimeType} className="h-4 w-4" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-zinc-200 truncate max-w-[180px]">{item.title || item.originalName}</p>
                      {item.description && (
                        <p className="text-xs text-zinc-500 truncate max-w-[180px] mt-0.5">{item.description}</p>
                      )}
                    </TableCell>
                    <TableCell><MediaTypeBadge mimeType={item.mimeType} /></TableCell>
                    <TableCell className="text-xs text-zinc-400">{formatBytes(item.size)}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-xs text-zinc-400">{item.uploadedBy || item.userId || '—'}</TableCell>
                    )}
                    <TableCell className="text-xs text-zinc-400">{formatDate(item.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setPreviewItem(item)}
                          className="h-7 w-7 rounded-lg hover:bg-zinc-800 flex items-center justify-center transition-colors"
                          title="Preview"
                        >
                          <Eye className="h-3.5 w-3.5 text-zinc-400 hover:text-zinc-200" />
                        </button>
                        <button
                          onClick={() => setEditItem(item)}
                          className="h-7 w-7 rounded-lg hover:bg-zinc-800 flex items-center justify-center transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5 text-zinc-400 hover:text-zinc-200" />
                        </button>
                        <button
                          onClick={() => setDeleteItem(item)}
                          className="h-7 w-7 rounded-lg hover:bg-red-900/40 flex items-center justify-center transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-zinc-400 hover:text-red-400" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Dialogs — always rendered, controlled by open prop */}
        <PreviewDialog item={previewItem} onClose={() => setPreviewItem(null)} />
        <EditDialog item={editItem} onClose={() => setEditItem(null)} />
        <DeleteDialog item={deleteItem} onClose={() => setDeleteItem(null)} />
      </div>
    </DashboardLayout>
  );
}
