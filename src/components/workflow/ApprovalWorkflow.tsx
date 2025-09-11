import React, { useState, useCallback, useMemo } from 'react';
import { CheckCircle, XCircle, Clock, User, ArrowRight, MessageSquare, FileText, AlertTriangle, Eye, Edit, Send, RotateCcw, Flag, Users, Calendar, Download } from 'lucide-react';
import { toast } from 'sonner';

interface ApprovalStep {
  id: string;
  name: string;
  description?: string;
  type: 'individual' | 'group' | 'any' | 'majority';
  approvers: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
  }>;
  requiredApprovals?: number; // For majority/group approvals
  autoApprove?: boolean;
  timeoutHours?: number;
  escalationTo?: string; // User ID to escalate to if timeout
  conditions?: Array<{
    field: string;
    operator: 'equals' | 'greaterThan' | 'lessThan' | 'contains';
    value: any;
  }>;
}

interface ApprovalRequest {
  id: string;
  title: string;
  description: string;
  requestType: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requester: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    department: string;
  };
  data: Record<string, any>;
  attachments: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  workflow: {
    id: string;
    name: string;
    steps: ApprovalStep[];
  };
  currentStep: number;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'cancelled' | 'expired';
  approvals: Array<{
    stepId: string;
    approverId: string;
    status: 'pending' | 'approved' | 'rejected';
    comment?: string;
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
  }>;
  comments: Array<{
    id: string;
    author: {
      id: string;
      name: string;
      avatar?: string;
    };
    content: string;
    type: 'comment' | 'system' | 'approval' | 'rejection';
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

interface ApprovalWorkflowProps {
  requests: ApprovalRequest[];
  currentUser: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
    permissions: string[];
  };
  onApprove?: (requestId: string, stepId: string, comment?: string) => void;
  onReject?: (requestId: string, stepId: string, comment: string) => void;
  onComment?: (requestId: string, comment: string) => void;
  onRequestUpdate?: (requestId: string, updates: Partial<ApprovalRequest>) => void;
  onEscalate?: (requestId: string, stepId: string, escalateTo: string) => void;
  onCancel?: (requestId: string, reason: string) => void;
  className?: string;
}

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
};

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  expired: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
};

const ApprovalWorkflow: React.FC<ApprovalWorkflowProps> = ({
  requests,
  currentUser,
  onApprove,
  onReject,
  onComment,
  onRequestUpdate,
  onEscalate,
  onCancel,
  className = ''
}) => {
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'my_approvals' | 'my_requests'>('all');
  const [commentText, setCommentText] = useState('');
  const [approvalComment, setApprovalComment] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  
  // Filter requests based on current filter
  const filteredRequests = useMemo(() => {
    switch (filter) {
      case 'pending':
        return requests.filter(req => req.status === 'pending' || req.status === 'in_progress');
      case 'my_approvals':
        return requests.filter(req => {
          const currentStep = req.workflow.steps[req.currentStep];
          return currentStep?.approvers.some(approver => approver.id === currentUser.id) &&
                 !req.approvals.some(approval => 
                   approval.stepId === currentStep.id && 
                   approval.approverId === currentUser.id &&
                   approval.status !== 'pending'
                 );
        });
      case 'my_requests':
        return requests.filter(req => req.requester.id === currentUser.id);
      default:
        return requests;
    }
  }, [requests, filter, currentUser.id]);
  
  // Get pending approvals for current user
  const pendingApprovals = useMemo(() => {
    return requests.filter(req => {
      const currentStep = req.workflow.steps[req.currentStep];
      return currentStep?.approvers.some(approver => approver.id === currentUser.id) &&
             !req.approvals.some(approval => 
               approval.stepId === currentStep.id && 
               approval.approverId === currentUser.id &&
               approval.status !== 'pending'
             ) &&
             (req.status === 'pending' || req.status === 'in_progress');
    });
  }, [requests, currentUser.id]);
  
  // Check if user can approve current step
  const canApproveStep = useCallback((request: ApprovalRequest) => {
    const currentStep = request.workflow.steps[request.currentStep];
    if (!currentStep) return false;
    
    const isApprover = currentStep.approvers.some(approver => approver.id === currentUser.id);
    const hasAlreadyApproved = request.approvals.some(approval => 
      approval.stepId === currentStep.id && 
      approval.approverId === currentUser.id &&
      approval.status !== 'pending'
    );
    
    return isApprover && !hasAlreadyApproved && 
           (request.status === 'pending' || request.status === 'in_progress');
  }, [currentUser.id]);
  
  // Get step status
  const getStepStatus = useCallback((request: ApprovalRequest, stepIndex: number) => {
    const step = request.workflow.steps[stepIndex];
    if (!step) return 'pending';
    
    const stepApprovals = request.approvals.filter(approval => approval.stepId === step.id);
    
    if (stepIndex < request.currentStep) {
      return 'completed';
    } else if (stepIndex === request.currentStep) {
      if (stepApprovals.some(approval => approval.status === 'rejected')) {
        return 'rejected';
      }
      
      switch (step.type) {
        case 'individual':
          return stepApprovals.some(approval => approval.status === 'approved') ? 'completed' : 'active';
        case 'any':
          return stepApprovals.some(approval => approval.status === 'approved') ? 'completed' : 'active';
        case 'majority':
          const approvedCount = stepApprovals.filter(approval => approval.status === 'approved').length;
          const requiredCount = step.requiredApprovals || Math.ceil(step.approvers.length / 2);
          return approvedCount >= requiredCount ? 'completed' : 'active';
        case 'group':
          const allApproved = step.approvers.every(approver => 
            stepApprovals.some(approval => 
              approval.approverId === approver.id && approval.status === 'approved'
            )
          );
          return allApproved ? 'completed' : 'active';
        default:
          return 'active';
      }
    } else {
      return 'pending';
    }
  }, []);
  
  // Handle approval action
  const handleApprovalAction = useCallback((action: 'approve' | 'reject') => {
    if (!selectedRequest) return;
    
    const currentStep = selectedRequest.workflow.steps[selectedRequest.currentStep];
    if (!currentStep) return;
    
    if (action === 'approve' && onApprove) {
      onApprove(selectedRequest.id, currentStep.id, approvalComment || undefined);
      toast.success('Request approved successfully');
    } else if (action === 'reject' && onReject) {
      if (!approvalComment.trim()) {
        toast.error('Please provide a reason for rejection');
        return;
      }
      onReject(selectedRequest.id, currentStep.id, approvalComment);
      toast.success('Request rejected');
    }
    
    setShowApprovalModal(false);
    setApprovalComment('');
    setShowDetails(false);
  }, [selectedRequest, approvalComment, onApprove, onReject]);
  
  // Handle comment submission
  const handleCommentSubmit = useCallback(() => {
    if (!selectedRequest || !commentText.trim()) return;
    
    if (onComment) {
      onComment(selectedRequest.id, commentText);
      setCommentText('');
      toast.success('Comment added');
    }
  }, [selectedRequest, commentText, onComment]);
  
  // Format date
  const formatDate = useCallback((date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }, []);
  
  // Calculate time remaining
  const getTimeRemaining = useCallback((request: ApprovalRequest) => {
    if (!request.dueDate) return null;
    
    const now = new Date();
    const diff = request.dueDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Overdue';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  }, []);
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Approval Workflow
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage approval requests and workflows
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {pendingApprovals.length > 0 && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {pendingApprovals.length} pending approval{pendingApprovals.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{requests.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {requests.filter(r => r.status === 'pending' || r.status === 'in_progress').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {requests.filter(r => r.status === 'approved').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">My Approvals</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{pendingApprovals.length}</p>
            </div>
            <User className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>
      
      {/* Filter Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'all', label: 'All Requests', count: requests.length },
            { key: 'pending', label: 'Pending', count: requests.filter(r => r.status === 'pending' || r.status === 'in_progress').length },
            { key: 'my_approvals', label: 'My Approvals', count: pendingApprovals.length },
            { key: 'my_requests', label: 'My Requests', count: requests.filter(r => r.requester.id === currentUser.id).length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                filter === tab.key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  filter === tab.key
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.map(request => {
          const currentStep = request.workflow.steps[request.currentStep];
          const canApprove = canApproveStep(request);
          const timeRemaining = getTimeRemaining(request);
          const isOverdue = request.dueDate && request.dueDate < new Date() && request.status !== 'approved' && request.status !== 'rejected';
          
          return (
            <div
              key={request.id}
              className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-all ${
                isOverdue ? 'border-red-300 dark:border-red-700' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {request.title}
                    </h3>
                    
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[request.status]}`}>
                      {request.status.replace('_', ' ')}
                    </span>
                    
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[request.priority]}`}>
                      {request.priority}
                    </span>
                    
                    {isOverdue && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Overdue
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    {request.description}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{request.requester.name}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(request.createdAt)}</span>
                    </div>
                    
                    {timeRemaining && (
                      <div className={`flex items-center space-x-1 ${
                        isOverdue ? 'text-red-500' : ''
                      }`}>
                        <Clock className="w-4 h-4" />
                        <span>{timeRemaining}</span>
                      </div>
                    )}
                    
                    {request.attachments.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <FileText className="w-4 h-4" />
                        <span>{request.attachments.length} attachment{request.attachments.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {canApprove && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setApprovalAction('approve');
                          setShowApprovalModal(true);
                        }}
                        className="flex items-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setApprovalAction('reject');
                          setShowApprovalModal(true);
                        }}
                        className="flex items-center space-x-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowDetails(true);
                    }}
                    className="flex items-center space-x-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Details</span>
                  </button>
                </div>
              </div>
              
              {/* Workflow Progress */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Workflow: {request.workflow.name}
                  </h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Step {request.currentStep + 1} of {request.workflow.steps.length}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {request.workflow.steps.map((step, index) => {
                    const stepStatus = getStepStatus(request, index);
                    
                    return (
                      <React.Fragment key={step.id}>
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium ${
                          stepStatus === 'completed' ? 'bg-green-500 text-white' :
                          stepStatus === 'active' ? 'bg-blue-500 text-white' :
                          stepStatus === 'rejected' ? 'bg-red-500 text-white' :
                          'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                        }`}>
                          {stepStatus === 'completed' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : stepStatus === 'rejected' ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        
                        {index < request.workflow.steps.length - 1 && (
                          <ArrowRight className={`w-4 h-4 ${
                            stepStatus === 'completed' ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'
                          }`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
                
                {currentStep && (
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Current: {currentStep.name}
                    {currentStep.approvers.length > 0 && (
                      <span className="ml-2">
                        ({currentStep.approvers.map(a => a.name).join(', ')})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No requests found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {filter === 'my_approvals' ? 'No pending approvals for you' :
               filter === 'my_requests' ? 'You haven\'t created any requests yet' :
               'No approval requests match the current filter'}
            </p>
          </div>
        )}
      </div>
      
      {/* Approval Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {approvalAction === 'approve' ? 'Approve Request' : 'Reject Request'}
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {selectedRequest.title}
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {approvalAction === 'approve' ? 'Comment (optional)' : 'Reason for rejection *'}
              </label>
              <textarea
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                placeholder={approvalAction === 'approve' ? 'Add a comment...' : 'Please provide a reason for rejection'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setApprovalComment('');
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={() => handleApprovalAction(approvalAction)}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  approvalAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {approvalAction === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalWorkflow;
export type { ApprovalStep, ApprovalRequest, ApprovalWorkflowProps };