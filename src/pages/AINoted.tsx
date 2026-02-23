
import React, { useState, useRef, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { TaskPriority, type User } from '../types';
import { api } from '../services/apiService';
import { useAuth } from '../context/AuthContext';

interface Props {
  users: User[];
  onTasksExtracted: (tasks: any[]) => void;
}

const AINoted: React.FC<Props> = ({ users, onTasksExtracted }) => {
  const { token } = useAuth();
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  
  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleTranscribe(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordTime(0);
      timerRef.current = window.setInterval(() => setRecordTime(prev => prev + 1), 1000);
    } catch (err) { alert("Gagal mengakses mikrofon."); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) window.clearInterval(timerRef.current);
    }
  };

  const handleTranscribe = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        const transcription = await geminiService.transcribeAudio(base64data, blob.type);
        if (transcription) setNotes(prev => prev + (prev ? "\n\n" : "") + transcription);
      };
    } finally { setIsTranscribing(false); }
  };

  // const handleAnalyze = async () => {
  //   if (!notes.trim()) return;

  //   setIsLoading(true);

  //   try {
  //       const results = await api.extractMeeting(token, notes);

  //       const enrichedResults = results.map((task: any) => ({
  //         ...task,
  //         raci: {
  //           accountable:
  //             users.find(u => u.id === task.accountableId) ?? null,
  //           responsible:
  //             (task.responsibleIds ?? [])
  //               .map((id: number) => users.find(u => u.id === id))
  //               .filter(Boolean),
  //           consulted:
  //             (task.consultedIds ?? [])
  //               .map((id: number) => users.find(u => u.id === id))
  //               .filter(Boolean),
  //           informed:
  //             (task.informedIds ?? [])
  //               .map((id: number) => users.find(u => u.id === id))
  //               .filter(Boolean),
  //         },
  //         requiresEvidence:
  //           task.priority === TaskPriority.URGENT ||
  //           task.priority === TaskPriority.HIGH,
  //       }));

  //       setPreview(enrichedResults);
  //     } catch (error) {
  //       console.error(error);
  //     } finally {
  //       setIsLoading(false);
  //     }
  // };

  const handleAnalyze = async () => {
  if (!notes.trim() || !token) return;

  setIsLoading(true);

  try {
    const results = await api.extractMeeting(token, notes);

    const enrichedResults = results.map((task: any) => ({
      ...task,
      raci: {
        accountable: task.accountable || null,
        responsible: task.responsible || [],
        consulted: task.consulted || [],
        informed: task.informed || [],
      },
      requiresEvidence:
        task.priority === TaskPriority.URGENT ||
        task.priority === TaskPriority.HIGH,
    }));

    setPreview(enrichedResults);
  } catch (error) {
    console.error(error);
  } finally {
    setIsLoading(false);
  }
};

  // const confirmImport = () => {
  //   onTasksExtracted(preview);
  //   setNotes('');
  //   setPreview([]);
  //   alert("Mandat Direksi Berbasis RACI Berhasil Didistribusikan!");
  // };

  const confirmImport = async () => {
  if (!token || preview.length === 0) return;

  try {
    const formattedTasks = preview.map(task => ({
      title: task.title,
      description: task.description,
      accountableId: task.accountableId ?? task.raci.accountable?.id,
      priority: task.priority,
      meetingDate: task.meetingDate || new Date().toISOString().split('T')[0],
      dueDate: task.dueDate,
      responsibleIds: task.raci.responsible.map((r: any) => r.id),
      consultedIds: task.raci.consulted.map((c: any) => c.id),
      informedIds: task.raci.informed.map((i: any) => i.id),
    }));

    await api.bulkCreateTasks(token, formattedTasks);

    // onTasksExtracted(preview);
    setNotes('');
    setPreview([]);
    alert("Mandat Direksi Berbasis RACI Berhasil Didistribusikan!");
  } catch (error) {
    console.error(error);
    alert("Gagal mendistribusikan mandat.");
  }
};

  return (
    <div className="max-w-5xl mx-auto space-y-8 lg:space-y-12 animate-in slide-in-from-bottom-6 duration-700">
      <div className="text-center space-y-2 lg:space-y-3">
        <h1 className="text-2xl lg:text-4xl font-black text-slate-900 tracking-tight italic">AI RACI Extraction</h1>
        <p className="text-slate-500 text-xs lg:text-base font-medium">Otomatisasi pemetaan akuntabilitas unit dari notulensi rapat Direksi.</p>
      </div>

      <div className="bg-white p-4 lg:p-10 rounded-[50px] border border-slate-200 shadow-xl space-y-6 lg:space-y-8">
        <div className="flex items-center justify-between bg-slate-50 p-6 rounded-3xl border border-slate-100">
           <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`}></div>
              <span className={`font-mono text-lg font-black ${isRecording ? 'text-red-600' : 'text-slate-400'}`}>{formatTime(recordTime)}</span>
           </div>
           {!isRecording ? (
                <button onClick={startRecording} className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-6 py-2.5 rounded-2xl font-bold text-sm hover:bg-slate-50 active:scale-95 transition-all">
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4z"></path><path d="M4 8a1 1 0 011 1 5 5 0 0010 0 1 1 0 112 0 7 7 0 01-6 6.92V17a1 1 0 11-2 0v-2.08A7 7 0 013 9a1 1 0 011-1z"></path></svg>
                  Rekam Rapat
                </button>
             ) : (
                <button onClick={stopRecording} className="flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-2xl font-bold text-sm hover:bg-red-700 shadow-lg active:scale-95 transition-all">Hentikan Rekam</button>
             )}
        </div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full h-80 p-10 bg-slate-50 rounded-[40px] border-none focus:ring-8 focus:ring-blue-100 transition-all outline-none resize-none font-medium text-slate-700 leading-relaxed text-lg" placeholder="Tempel notulensi rapat di sini..." />
        <button onClick={handleAnalyze} disabled={isLoading || !notes.trim()} className={`w-full py-6 rounded-[30px] font-black text-xl shadow-xl transition-all duration-300 ${isLoading ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
          {isLoading ? 'Processing RACI Matrix...' : 'Extract & Sync Agenda Items'}
        </button>
      </div>

      {preview.length > 0 && (
        <div className="space-y-8 animate-in zoom-in duration-500 pb-20">
          <div className="flex justify-between items-center px-2">
             <h3 className="text-2xl font-black text-slate-900">Review RACI Assignments</h3>
             <button onClick={confirmImport} className="bg-slate-900 text-white px-12 py-4 rounded-[20px] font-black text-sm shadow-xl hover:shadow-2xl transition-all">Distribute All Mandates</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {preview.map((task, idx) => (
              <div key={idx} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-lg space-y-6">
                 <div>
                    <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{task.priority}</span>
                    <h4 className="font-black text-lg text-slate-900 leading-tight mt-3">{task.title}</h4>
                 </div>
                 
                 <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-2xl border border-blue-100">
                       <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Accountable (A)</p>
                       <div className="flex items-center gap-2">
                          {/* <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${task.raci.accountable.avatar_seed}`} className="w-6 h-6 rounded-lg bg-white" alt="" />
                          <span className="text-[10px] font-black">{task.raci.accountable.name}</span> */}

                          <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${task.raci.accountable.avatar_seed}`}
                            className="w-6 h-6 rounded-lg bg-white"
                          />
                          <span className="text-[10px] font-black">
                            {task.raci.accountable.name}
                          </span>
                       </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Responsible (R)</p>
                       <div className="flex -space-x-1.5">
                          {task.raci.responsible.map((r: any, i: number) => (
                            <img key={i} title={r.name} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${r.avatar_seed}`} className="w-6 h-6 rounded-lg border border-white bg-white" alt="" />
                          ))}
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                    <div>
                       <p className="text-[8px] font-black text-slate-400 uppercase">Meeting Date</p>
                       <p className="text-xs font-bold text-slate-800">{task.meetingDate}</p>
                    </div>
                    <div>
                       <p className="text-[8px] font-black text-slate-400 uppercase">Target Due Date</p>
                       <p className="text-xs font-black text-blue-600">{task.dueDate}</p>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AINoted;
