import React, { useState } from 'react';
import { Mail, Phone, MapPin, Award, MoreVertical, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { useTeams } from '../contexts/TeamsContext';
import Skeleton from '../components/ui/Skeleton';
import CreateTeamMemberModal from '../components/CreateTeamMemberModal';

const TeamCard = ({ member }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center text-center hover:shadow-md transition-shadow relative group">
        <button className="absolute top-4 right-4 text-slate-300 hover:text-slate-600">
            <MoreVertical size={16} />
        </button>

        <div className="w-20 h-20 rounded-full bg-premium-blue-100 text-premium-blue-700 flex items-center justify-center text-2xl font-bold mb-4">
            {member.name.charAt(0)}
        </div>

        <h3 className="font-bold text-premium-blue-900">{member.name}</h3>
        <p className="text-sm text-premium-gold-600 font-medium mb-1">{member.role}</p>
        <div className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full mb-4">
            {member.dept}
        </div>

        <div className="w-full flex justify-center gap-3 border-t border-slate-100 pt-4">
            <button className="p-2 rounded-full bg-slate-50 text-slate-400 hover:bg-premium-blue-50 hover:text-premium-blue-600 transition-colors">
                <Mail size={16} />
            </button>
            <button className="p-2 rounded-full bg-slate-50 text-slate-400 hover:bg-premium-blue-50 hover:text-premium-blue-600 transition-colors">
                <Phone size={16} />
            </button>
            <Link to={`/teams/${member.id}`} className="p-2 rounded-full bg-slate-50 text-slate-400 hover:bg-premium-blue-50 hover:text-premium-blue-600 transition-colors">
                <Award size={16} />
            </Link>
        </div>
    </div>
);

export default function TeamsList() {
    const { teamMembers, loading } = useTeams();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredMembers = teamMembers ? teamMembers.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.role?.toLowerCase().includes(searchQuery.toLowerCase())
    ) : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-premium-blue-900">Team Directory</h1>
                    <p className="text-slate-500">Manage your staff, engineers, and administrators.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-premium-blue-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-premium-blue-800 shadow-lg shadow-premium-blue-900/20"
                >
                    + Add Member
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-4 w-full">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, role, or ID..."
                            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50 border-none focus:ring-2 focus:ring-premium-gold-400 text-sm"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
                        <Filter size={16} /> Department
                    </button>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <Skeleton className="h-64 rounded-xl" count={4} />
                </div>
            ) : filteredMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <p className="font-medium">No team members found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredMembers.map(member => (
                        <TeamCard key={member.id} member={member} />
                    ))}
                </div>
            )}

            <CreateTeamMemberModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
            />
        </div>
    );
}
