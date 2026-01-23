import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Trash2, Send, X, Volume2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

export default function VoiceRecorderModal({ onClose, projectId }) {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
            };

            recorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
        } catch (err) {
            console.error("Recording error:", err);
            toast.error("Could not access microphone");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            clearInterval(timerRef.current);
        }
    };

    const discardRecording = () => {
        setAudioBlob(null);
        setRecordingTime(0);
    };

    const handleSend = async () => {
        if (!audioBlob) return;

        const toastId = toast.loading('Transcribing & Extracting Tasks...');
        try {
            // Convert blob to base64 if needed, or send as multipart
            // n8n multipart handling can be tricky, let's try multipart first
            const formData = new FormData();
            formData.append('audio', audioBlob, `punchlist_${projectId}.webm`);
            formData.append('projectId', projectId);
            formData.append('timestamp', new Date().toISOString());

            const response = await fetch('http://localhost:5678/webhook/voice-punchlist', {
                method: 'POST',
                body: formData
                // Note: Don't set Content-Type header when sending FormData, 
                // the browser will set it with the correct boundary.
            });

            if (!response.ok) throw new Error('Service integration failed');

            toast.success('Tasks extracted and added to project!', { id: toastId });
            onClose();
        } catch (err) {
            console.error("Upload error:", err);
            toast.error("Failed to process voice note. Ensure n8n is running.", { id: toastId });
        }
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-8 pb-4 flex justify-between items-center">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black text-premium-blue-900 tracking-tight">Voice Punch List</h2>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Site Visit Intelligence</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                <div className="p-8 pt-4 flex flex-col items-center gap-8">
                    {/* Visualizer Placeholder / Timer */}
                    <div className={clsx(
                        "w-48 h-48 rounded-full flex flex-col items-center justify-center relative transition-all duration-500",
                        isRecording ? "bg-rose-50 ring-8 ring-rose-50/50 scale-110" : "bg-slate-50 ring-8 ring-slate-50/50"
                    )}>
                        {isRecording && (
                            <div className="absolute inset-0 rounded-full border-4 border-rose-500 animate-ping opacity-20"></div>
                        )}
                        <span className={clsx(
                            "text-4xl font-black mb-2",
                            isRecording ? "text-rose-600" : "text-slate-900"
                        )}>
                            {formatTime(recordingTime)}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            {isRecording ? "Recording Live" : audioBlob ? "Recording Ready" : "Tap Mic to Start"}
                        </span>
                    </div>

                    {!audioBlob ? (
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            className={clsx(
                                "w-24 h-24 rounded-full flex items-center justify-center shadow-2xl shadow-rose-900/20 transition-all active:scale-90",
                                isRecording ? "bg-rose-600 text-white" : "bg-premium-blue-900 text-white hover:bg-premium-blue-800"
                            )}
                        >
                            {isRecording ? <Square size={32} fill="currentColor" /> : <Mic size={32} />}
                        </button>
                    ) : (
                        <div className="flex flex-col w-full gap-4">
                            <div className="bg-slate-50 p-4 rounded-3xl flex items-center justify-between border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-600 shadow-sm">
                                        <Volume2 size={20} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-slate-700">punch_extract.webm</p>
                                        <p className="text-[10px] font-bold text-slate-400">{formatTime(recordingTime)} recorded</p>
                                    </div>
                                </div>
                                <button onClick={discardRecording} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                    <Trash2 size={20} />
                                </button>
                            </div>

                            <button
                                onClick={handleSend}
                                className="w-full bg-premium-blue-900 text-white py-5 rounded-[2rem] font-black text-lg hover:bg-premium-blue-800 shadow-xl shadow-premium-blue-900/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-3"
                            >
                                <Send size={24} />
                                Generate Punch List
                            </button>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-slate-50/50 border-t border-slate-100 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                        AI will transcribe your notes and automatically create <br />
                        actionable tasks in the project issue tracker.
                    </p>
                </div>
            </div>
        </div>
    );
}
