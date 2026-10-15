import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  MapPin,
  Calendar,
  User,
  Trash2,
  AlertTriangle,
  ImagePlus,
  X,
  ShieldCheck,
  ArrowRightCircle,
} from 'lucide-react';
import { getReport, getReportComments, updateReportStatus, deleteReport, addStatusComment, uploadStatusImage } from '@/services/reports';
import { useAuth } from '@/contexts/AuthContext';
import { isDemoMode } from '@/lib/demo';
import { MOCK_REPORTS, MOCK_COMMENTS } from '@/data/mockData';
import { StatusBadge } from '@/components/StatusBadge';
import { MediaGallery } from '@/components/MediaGallery';
import { CATEGORY_LABELS, CATEGORY_ICONS, type Report, type Comment, type ReportStatus } from '@/types';

export function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ReportStatus | null>(null);
  const [statusComment, setStatusComment] = useState('');
  const [statusImage, setStatusImage] = useState<File | null>(null);
  const [statusImagePreview, setStatusImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    if (isDemoMode()) {
      const r = MOCK_REPORTS.find((rep) => rep.id === id) || null;
      setReport(r);
      setComments(MOCK_COMMENTS[id] || []);
      setLoading(false);
      return;
    }
    (async () => {
      const [r, c] = await Promise.all([getReport(id), getReportComments(id)]);
      setReport(r);
      setComments(c);
      setLoading(false);
    })();
  }, [id]);

  const handleStatusChange = (status: ReportStatus) => {
    setPendingStatus(status);
    setStatusComment('');
    setStatusImage(null);
    setStatusImagePreview(null);
    setShowStatusModal(true);
  };

  const handleStatusImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatusImage(file);
    const reader = new FileReader();
    reader.onload = () => setStatusImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeStatusImage = () => {
    setStatusImage(null);
    setStatusImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmStatusChange = async () => {
    if (!id || !pendingStatus || !report || !statusComment.trim()) return;
    setStatusUpdating(true);
    try {
      if (!isDemoMode()) {
        let imageUrl: string | undefined;
        if (statusImage) {
          imageUrl = await uploadStatusImage(id, statusImage);
        }
        await addStatusComment(
          id,
          statusComment.trim(),
          user?.uid || 'admin',
          user?.displayName || 'Mayor',
          report.status,
          pendingStatus,
          imageUrl,
        );
        await updateReportStatus(id, pendingStatus);
      }

      const newComment: Comment = {
        id: `temp_${Date.now()}`,
        reportId: id,
        text: statusComment.trim(),
        authorId: user?.uid || 'admin',
        authorName: user?.displayName || 'Mayor',
        createdAt: new Date(),
        type: 'status_update',
        statusChange: { from: report.status, to: pendingStatus },
        imageUrl: statusImagePreview || undefined,
      };
      setComments((prev) => [...prev, newComment]);
      setReport((r) => (r ? { ...r, status: pendingStatus, commentCount: r.commentCount + 1 } : null));
    } finally {
      setStatusUpdating(false);
      setShowStatusModal(false);
      setPendingStatus(null);
      setStatusComment('');
      setStatusImage(null);
      setStatusImagePreview(null);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!isDemoMode()) {
      await deleteReport(id);
    }
    navigate('/dashboard');
  };

  const formatDate = (ts: any) => {
    if (!ts) return 'Unknown';
    const d = ts?.toDate?.() || new Date(ts);
    return d.toLocaleDateString('en-CA', {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted">Report not found.</p>
        <button onClick={() => navigate('/dashboard')} className="text-accent hover:underline">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-card border-b border-[var(--border)] px-6 py-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-muted hover:text-themed transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{CATEGORY_ICONS[report.category]}</span>
              <h1 className="text-2xl font-bold">{report.title}</h1>
            </div>
            <p className="text-sm text-muted">
              {CATEGORY_LABELS[report.category]} &middot; Reported by{' '}
              <span className="text-themed font-medium">{report.authorName}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={report.status} />
            <select
              value={report.status}
              onChange={(e) => handleStatusChange(e.target.value as ReportStatus)}
              disabled={statusUpdating}
              className="bg-surface border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-themed focus:outline-none focus:border-accent"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Delete report"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Media + Description */}
        <div className="lg:col-span-2 space-y-6">
          <MediaGallery media={report.media} />

          <div className="bg-card border border-[var(--border)] rounded-xl p-6">
            <h3 className="text-sm font-medium text-muted mb-3">Description</h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{report.description}</p>
          </div>

          {/* Comments */}
          <div className="bg-card border border-[var(--border)] rounded-xl p-6">
            <h3 className="text-sm font-medium text-muted mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Comments ({comments.length})
            </h3>
            {comments.length === 0 ? (
              <p className="text-sm text-muted">No comments yet.</p>
            ) : (
              <div className="space-y-4">
                {[...comments]
                  .sort((a, b) => {
                    if (a.type === 'status_update' && b.type !== 'status_update') return -1;
                    if (a.type !== 'status_update' && b.type === 'status_update') return 1;
                    return 0;
                  })
                  .map((c) =>
                    c.type === 'status_update' ? (
                      <div key={c.id} className="border-l-2 border-accent pl-4 bg-accent/5 rounded-r-lg py-3 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <ShieldCheck className="w-4 h-4 text-accent" />
                          <span className="text-sm font-semibold text-accent">{c.authorName}</span>
                          {c.statusChange && (
                            <span className="inline-flex items-center gap-1 text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
                              {c.statusChange.from.replace('_', ' ')}
                              <ArrowRightCircle className="w-3 h-3" />
                              {c.statusChange.to.replace('_', ' ')}
                            </span>
                          )}
                          <span className="text-xs text-muted">{formatDate(c.createdAt)}</span>
                        </div>
                        <p className="text-sm mt-1">{c.text}</p>
                        {c.imageUrl && (
                          <img
                            src={c.imageUrl}
                            alt="Status update"
                            className="mt-3 rounded-lg max-h-48 object-cover border border-[var(--border)]"
                          />
                        )}
                      </div>
                    ) : (
                      <div key={c.id} className="border-l-2 border-[var(--border)] pl-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{c.authorName}</span>
                          <span className="text-xs text-muted">{formatDate(c.createdAt)}</span>
                        </div>
                        <p className="text-sm text-comment">{c.text}</p>
                      </div>
                    )
                  )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Details sidebar */}
        <div className="space-y-4">
          <div className="bg-card border border-[var(--border)] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <ThumbsUp className="w-5 h-5 text-orange-400" />
              <div>
                <p className="text-2xl font-bold">{report.upvoteCount}</p>
                <p className="text-xs text-muted">Upvotes</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-2xl font-bold">{report.commentCount}</p>
                <p className="text-xs text-muted">Comments</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-[var(--border)] rounded-xl p-5 space-y-3">
            <h4 className="text-sm font-medium text-muted">Details</h4>
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted shrink-0 mt-0.5" />
              <span>{report.location.address}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted shrink-0" />
              <span>{formatDate(report.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted shrink-0" />
              <span>{report.authorName}</span>
            </div>
            <div className="text-xs text-muted mt-2">
              Coordinates: {report.location.latitude.toFixed(5)}, {report.location.longitude.toFixed(5)}
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={() => !statusUpdating && setShowStatusModal(false)}>
          <div className="bg-card border border-[var(--border)] rounded-2xl p-6 max-w-md mx-4 w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-1">Update Status</h3>
            <p className="text-sm text-muted mb-4">
              Changing status to{' '}
              <span className="inline-flex items-center gap-1">
                <StatusBadge status={pendingStatus!} />
              </span>
            </p>

            <label className="block text-sm font-medium mb-1.5">
              Comment <span className="text-accent">*</span>
            </label>
            <textarea
              value={statusComment}
              onChange={(e) => setStatusComment(e.target.value)}
              placeholder={pendingStatus === 'in_progress'
                ? 'e.g. Our team has been dispatched to investigate this issue...'
                : pendingStatus === 'resolved'
                  ? 'e.g. This issue has been fixed. Thank you for reporting!'
                  : 'Add a comment about this status change...'}
              rows={3}
              maxLength={1000}
              disabled={statusUpdating}
              className="w-full bg-surface border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-themed placeholder:text-muted/50 focus:outline-none focus:border-accent resize-none"
            />
            <p className="text-xs text-muted mt-1 mb-3">{statusComment.length}/1000</p>

            <label className="block text-sm font-medium mb-1.5">
              Image <span className="text-muted font-normal">(optional)</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleStatusImageSelect}
              className="hidden"
            />
            {statusImagePreview ? (
              <div className="relative inline-block mb-3">
                <img src={statusImagePreview} alt="Preview" className="h-28 rounded-lg object-cover border border-[var(--border)]" />
                <button
                  onClick={removeStatusImage}
                  disabled={statusUpdating}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={statusUpdating}
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted border border-dashed border-[var(--border)] rounded-lg hover:border-accent hover:text-accent transition-colors mb-3"
              >
                <ImagePlus className="w-4 h-4" />
                Attach image
              </button>
            )}

            <div className="flex gap-3 justify-end pt-2 border-t border-[var(--border)]">
              <button
                onClick={() => setShowStatusModal(false)}
                disabled={statusUpdating}
                className="px-4 py-2 text-sm text-muted hover:text-themed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={statusUpdating || !statusComment.trim()}
                className="px-4 py-2 bg-accent hover:bg-accent/80 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {statusUpdating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-card border border-[var(--border)] rounded-2xl p-6 max-w-sm mx-4 w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 text-red-400 mb-4">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Delete Report</h3>
            </div>
            <p className="text-sm text-muted mb-6">
              This will permanently delete this report and all associated data. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm text-muted hover:text-themed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
