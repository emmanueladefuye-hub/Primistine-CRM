import React from 'react';
import { UserPlus, User } from 'lucide-react';

export default function TeamCard({ project }) {
    const team = project.team || [];

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Project Team</h3>
                <button className="text-blue-600 text-xs font-bold hover:underline">Manage</button>
            </div>

            <div className="space-y-3 mb-auto">
                {team.length > 0 ? team.map((member, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs ring-2 ring-white">
                            {member.avatar ? <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" /> : <User size={14} />}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800">{member.name}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-medium">{member.role}</p>
                        </div>
                    </div>
                )) : (
                    <p className="text-sm text-slate-400 italic">No team assigned</p>
                )}
            </div>

            <button className="w-full mt-4 py-2 flex items-center justify-center gap-2 text-xs font-bold text-slate-500 border border-dashed border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                <UserPlus size={14} />
                Reassign Team
            </button>
        </div>
    );
}
