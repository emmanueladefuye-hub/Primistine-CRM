import React, { useState } from 'react';
import { Camera, Download, Trash2, Maximize2, X, ChevronLeft, ChevronRight, UploadCloud } from 'lucide-react';
import { useCollection } from '../../../hooks/useFirestore';
import { where, orderBy } from 'firebase/firestore';
import Skeleton from '../../ui/Skeleton';
import EmptyState from '../../ui/EmptyState';

export default function TabPhotos({ project }) {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [lightboxIndex, setLightboxIndex] = useState(null);

    // Live Data
    const { data: photos, loading } = useCollection('project_photos', [
        where('projectId', '==', project.id),
        orderBy('createdAt', 'desc')
    ]);

    const categories = ['All', 'Before Installation', 'During Installation', 'Testing', 'Completed Work', 'Issues'];

    if (loading) return <Skeleton count={8} variant="rectangular" className="aspect-square rounded-xl" wrapperClassName="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" />;

    const filteredPhotos = selectedCategory === 'All'
        ? photos
        : photos.filter(p => p.category === selectedCategory);

    return (
        <div>
            {/* Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${selectedCategory === cat
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm">
                    <UploadCloud size={16} /> Upload Photos
                </button>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Upload Placeholder */}
                <div className="aspect-square border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                    <div className="p-3 bg-white rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                        <Camera size={24} className="text-slate-400 group-hover:text-blue-500" />
                    </div>
                    <p className="text-xs font-bold text-slate-500 group-hover:text-blue-600">Add Photo</p>
                </div>

                {filteredPhotos.map((photo, idx) => (
                    <div
                        key={photo.id}
                        onClick={() => setLightboxIndex(idx)}
                        className="aspect-square rounded-xl overflow-hidden relative group cursor-pointer border border-slate-200 shadow-sm"
                    >
                        <img src={photo.url} alt={photo.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                            <p className="text-white font-bold text-sm truncate">{photo.label || 'Untitled'}</p>
                            <div className="flex justify-between items-end mt-1">
                                <p className="text-white/80 text-[10px]">
                                    {photo.createdAt?.seconds ? new Date(photo.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'} • {photo.uploaderName || 'Unknown'}
                                </p>
                                <div className="flex gap-2">
                                    <button className="p-1.5 bg-white/20 hover:bg-white/40 rounded-lg text-white backdrop-blur-sm transition-colors">
                                        <Download size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="p-1 bg-black/50 rounded text-white text-[10px] font-medium backdrop-blur-sm px-2">
                                {photo.category}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Lightbox / Modal can be implemented later if needed */}
        </div>
    );
}
