import React, { useState } from 'react';
import { User, FileText, Calendar, Plus, Send } from 'lucide-react';
import { useCollection } from '../../../hooks/useFirestore';
import { db } from '../../../lib/firebase';
import { collection, addDoc, serverTimestamp, orderBy, query, where } from 'firebase/firestore';

export default function TabOverview({ project }) {
    const [newNote, setNewNote] = useState("");

    // Live Notes
    const { data: notes, loading: notesLoading } = useCollection('project_notes', [
        where('projectId', '==', project.id),
        orderBy('createdAt', 'desc')
    ]);

    const handleAddNote = async () => {
        if (!newNote.trim()) return;

        try {
            await addDoc(collection(db, 'project_notes'), {
                projectId: project.id,
                text: newNote,
                author: "Admin User", // TODO: Replace with real auth user
                createdAt: serverTimestamp()
            });
            setNewNote("");
        } catch (err) {
            console.error("Failed to add note", err);
            alert("Failed to save note. Please try again.");
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Docs & Activity Summary */}
            <div className="space-y-6">
                {/* Related Documents */}
                <div className="bg-white p-5 rounded-xl border border-slate-200">
                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                        <FileText size={16} /> Related Documents
                    </h3>
                    <div className="space-y-2">
                        {project.documents && project.documents.length > 0 ? (
                            project.documents.map((doc, idx) => (
                                <DocLink key={idx} label={doc.name} date={doc.date} type={doc.type} />
                            ))
                        ) : (
                            <div className="py-4 text-center border-2 border-dashed border-slate-100 rounded-lg">
                                <p className="text-xs text-slate-400">No documents uploaded yet</p>
                                <button className="text-[10px] text-blue-600 font-bold mt-1 hover:underline">Upload Document</button>
                            </div>
                        )}
                        {/* Placeholder for common docs if they aren't in the list yet */}
                        {!project.documents?.some(d => d.type === 'audit') && <DocLink label="Site Audit Report" date="Pending" type="pdf" disabled />}
                        {!project.documents?.some(d => d.type === 'quote') && <DocLink label="Project Quote" date="Pending" type="invoice" disabled />}
                    </div>
                </div>
            </div>

            {/* Middle Column - Key Dates */}
            <div className="space-y-6">
                <div className="bg-white p-5 rounded-xl border border-slate-200 h-full">
                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Calendar size={16} /> Key Dates
                    </h3>
                    <div className="space-y-4">
                        <DateRow label="Audit Date" date={project.auditDate || '-'} />
                        <DateRow label="Quote Accepted" date={project.quoteAcceptedDate || '-'} />
                        <DateRow label="Project Start" date={project.startDate || (project.createdAt ? new Date(project.createdAt.seconds * 1000).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '-')} />
                        <DateRow label="Est. Completion" date={project.timeline?.expectedCompletion || 'TBD'} highlight />
                        <DateRow label="Actual Completion" date={project.actualCompletionDate || '-'} />
                    </div>
                </div>
            </div>

            {/* Right Column - Notes */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col h-[400px]">
                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-4">Project Notes</h3>

                <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 thin-scrollbar">
                    {notesLoading && <div className="text-xs text-slate-400 text-center py-4">Loading notes...</div>}
                    {!notesLoading && notes.length === 0 && <div className="text-xs text-slate-400 text-center py-4">No notes yet. Start the conversation!</div>}

                    {notes.map(note => (
                        <div key={note.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm">
                            <p className="text-slate-700 mb-2 whitespace-pre-wrap">{note.text}</p>
                            <div className="flex justify-between text-xs text-slate-400">
                                <span className="font-bold">{note.author || 'Unknown'}</span>
                                <span>{note.createdAt?.seconds ? new Date(note.createdAt.seconds * 1000).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="relative">
                    <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add a note..."
                        className="w-full pl-3 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:outline-none resize-none"
                        rows="2"
                    />
                    <button
                        onClick={handleAddNote}
                        className="absolute bottom-2 right-2 p-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function DocLink({ label, date, type, disabled }) {
    return (
        <div className={`flex items-center justify-between p-2 rounded-lg transition-colors border border-transparent ${disabled ? 'opacity-50 grayscale cursor-not-allowed bg-slate-50/50' : 'hover:bg-slate-50 cursor-pointer group hover:border-slate-100'}`}>
            <div className="flex items-center gap-3">
                <div className={`bg-slate-100 p-2 rounded text-slate-500 ${!disabled && 'group-hover:bg-blue-50 group-hover:text-blue-600'} transition-colors`}>
                    <FileText size={14} />
                </div>
                <div>
                    <p className={`text-sm font-medium ${disabled ? 'text-slate-400' : 'text-slate-700 group-hover:text-blue-700'}`}>{label}</p>
                    <p className="text-xs text-slate-400">{date}</p>
                </div>
            </div>
            {!disabled && <button className="text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">View</button>}
        </div>
    )
}

function DateRow({ label, date, highlight }) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
            <span className="text-sm text-slate-500">{label}</span>
            <span className={`text-sm font-bold ${highlight ? 'text-blue-600' : 'text-slate-800'}`}>{date}</span>
        </div>
    )
}
