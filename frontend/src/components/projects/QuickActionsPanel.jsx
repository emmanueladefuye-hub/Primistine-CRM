import React from 'react';
import { AlertCircle, Camera, CheckSquare, Calendar, MessageSquare, FileText } from 'lucide-react';

export default function QuickActionsPanel({ onAction }) {
    const actions = [
        { id: 'report_issue', label: 'Report Issue', icon: AlertCircle, color: 'text-red-600 bg-red-50 hover:bg-red-100' },
        { id: 'upload_photo', label: 'Upload Photo', icon: Camera, color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
        { id: 'complete_phase', label: 'Complete Phase', icon: CheckSquare, color: 'text-green-600 bg-green-50 hover:bg-green-100' },
        { id: 'schedule_visit', label: 'Schedule Visit', icon: Calendar, color: 'text-purple-600 bg-purple-50 hover:bg-purple-100' },
        { id: 'message_client', label: 'Message Client', icon: MessageSquare, color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' },
        { id: 'generate_invoice', label: 'Generate Invoice', icon: FileText, color: 'text-slate-600 bg-slate-50 hover:bg-slate-100' },
    ];

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 h-full">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
                {actions.map(action => (
                    <button
                        key={action.id}
                        onClick={() => onAction && onAction(action.id)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${action.color} border border-transparent hover:border-current/10`}
                    >
                        <action.icon size={20} className="mb-2" />
                        <span className="text-[11px] font-bold">{action.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
