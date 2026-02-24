
import React, { useState, useRef, useEffect } from 'react';
import { TaskStatus, type RACIMatrix, type Task, type User } from '../types';
import { api } from '../services/apiService';
import { useAuth } from '../context/AuthContext';

const TaskList: React.FC = () => {
  const { user: currentUser } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('bt_token') || '';

  // ============================
  // FETCH DATA FROM API
  // ============================
  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const [tasksData, usersData] = await Promise.all([
  //         api.getTasks(token),
  //         api.getUsers(token),
  //       ]);

  //       setTasks(tasksData);
  //       setUsers(usersData);
  //     } catch (err) {
  //       console.error('Failed fetch:', err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   if (token) fetchData();
  // }, []);

  useEffect(() => {
  const fetchData = async () => {
    try {
      console.log("TOKEN:", token);

      const tasksData = await api.getTasks(token);
      console.log("TASKS RESPONSE:", tasksData);

      const usersData = await api.getUsers(token);
      console.log("USERS RESPONSE:", usersData);

      setTasks(tasksData);
      setUsers(usersData);
    } catch (err) {
      console.error("FETCH ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  if (token) {
    fetchData();
  } else {
    setLoading(false);
  }
}, []);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [updateText, setUpdateText] = useState('');
  const [targetStatus, setTargetStatus] = useState<TaskStatus | ''>('');
  const [evidence, setEvidence] = useState<{ data: string, name: string } | null>(null);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentions, setMentions] = useState<string[]>([]);
  const [showExtensionForm, setShowExtensionForm] = useState(false);
  const [isEditingRaci, setIsEditingRaci] = useState(false);
  const [reqDate, setReqDate] = useState('');
  const [reqReason, setReqReason] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (loading) return <div className="p-10">Loading...</div>;
  if (!currentUser) return null;

  const selectedTask = tasks.find(t => t.id === selectedId);

  const isAccountable = selectedTask?.raci.accountable.id === currentUser.id;
  const isResponsible = selectedTask?.raci.responsible.some(r => r.id === currentUser.id);
  const canUpdate = currentUser.role === 'SECRETARY' || isAccountable || isResponsible;

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUpdateText(val);
    const lastAt = val.lastIndexOf('@');
    if (lastAt !== -1 && (lastAt === 0 || val[lastAt - 1] === ' ')) {
      setShowMentionPicker(true);
    } else {
      setShowMentionPicker(false);
    }
  };

  const addMention = (user: User) => {
    const lastAt = updateText.lastIndexOf('@');
    const newText = updateText.substring(0, lastAt) + '@' + user.name + ' ';
    setUpdateText(newText);
    setMentions(prev => Array.from(new Set([...prev, user.id])));
    setShowMentionPicker(false);
    inputRef.current?.focus();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEvidence({ data: reader.result as string, name: file.name });
      reader.readAsDataURL(file);
    }
  };

  const submitDateChange = async () => {
    if (!reqDate || !reqReason) {
      alert("Mohon isi tanggal baru dan alasan.");
      return;
    }
    if (selectedTask) {
      await fetch(`${import.meta.env.VITE_API_URL}/tasks/${selectedTask.id}/update-date`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newDate: reqDate, reason: reqReason }),
      });

      setReqDate('');
      setReqReason('');
      setShowExtensionForm(false);
      alert("Due Date diperbarui. Alert dikirim ke Sekretaris.");
    }
  };

  const handleAddUpdate = async () => {
    if (!selectedTask || !updateText.trim()) return;

    await fetch(`${import.meta.env.VITE_API_URL}/tasks/${selectedTask.id}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        content: updateText,
        status: targetStatus || undefined,
        mentions,
        evidence,
      }),
    });

    setUpdateText('');
    setTargetStatus('');
    setMentions([]);
    setEvidence(null);
  };

  const handleUpdateRACI = async (newRaci: RACIMatrix) => {
    if (!selectedTask) return;

    await fetch(`${import.meta.env.VITE_API_URL}/tasks/${selectedTask.id}/raci`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newRaci),
    });

    setIsEditingRaci(false);
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.CLOSED: return 'bg-slate-200 text-slate-800 border-slate-300';
      case TaskStatus.PENDING_CLOSING: return 'bg-indigo-100 text-indigo-900 border-indigo-200';
      case TaskStatus.STAGNANT: return 'bg-red-100 text-red-900 border-red-200';
      case TaskStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-900 border-blue-200';
      case TaskStatus.ON_TRACK: return 'bg-emerald-100 text-emerald-900 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const statusOptions = [
    TaskStatus.ON_TRACK,
    TaskStatus.IN_PROGRESS,
    TaskStatus.PENDING,
    TaskStatus.STAGNANT,
    TaskStatus.PENDING_CLOSING,
    ...(currentUser.role === 'SECRETARY' ? [TaskStatus.CLOSED] : [])
  ];

  return (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] overflow-hidden text-slate-900">

    {/* {previewImage && (
      <div 
        className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4" 
        onClick={() => setPreviewImage(null)}
      >
        <img src={previewImage} className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl border-4 border-white/10" alt="Preview" />
        <button className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center text-xl">✕</button>
      </div>
    )} */}

    <div className={`lg:col-span-3 flex flex-col space-y-3 h-full overflow-hidden ${selectedId ? 'hidden lg:flex' : 'flex'}`}>
      <h2 className="font-black text-slate-900 uppercase tracking-widest text-[10px] px-2">
        Mandat Direksi Aktif
      </h2>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2 pb-6">
        {tasks.filter(t => t.status !== TaskStatus.CLOSED).map((task) => (
          <div
            key={task.id}
            onClick={() => { 
              setSelectedId(task.id); 
              setShowMentionPicker(false); 
              setShowExtensionForm(false); 
              setIsEditingRaci(false); 
            }}
            className={`p-4 rounded-[24px] border cursor-pointer transition-all duration-300
              ${selectedId === task.id 
                ? 'bg-white border-blue-500 shadow-lg ring-2 ring-blue-50' 
                : 'bg-white border-slate-200 hover:border-slate-300'
              }
            `}
          >
            <div className="flex justify-between items-center mb-2">
              <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded border ${getStatusColor(task.status)}`}>
                {task.status}
              </span>
              <span className="text-[9px] font-bold text-slate-500">
                {task.dueDate}
              </span>
            </div>
            <h4 className={`font-bold leading-tight text-xs line-clamp-2 ${
              selectedId === task.id ? 'text-blue-700' : 'text-slate-800'
            }`}>
              {task.title}
            </h4>
          </div>
        ))}
      </div>
    </div>

    <div className={`lg:col-span-9 bg-white rounded-[40px] border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden ${!selectedId ? 'hidden lg:flex' : 'flex'}`}>
      
      {selectedTask ? (
        <>
          {/* HEADER */}
          <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <button 
                onClick={() => setSelectedId(null)} 
                className="text-blue-700 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-100 px-3 py-2 rounded-xl transition-all"
              >
                KEMBALI
              </button>

              <div className="flex flex-wrap gap-2">
                <div className={`px-3 py-1 rounded-full text-[8px] font-black border uppercase ${getStatusColor(selectedTask.status)}`}>
                  {selectedTask.status}
                </div>
                <div className="px-3 py-1 rounded-full text-[8px] font-black border border-slate-200 bg-white text-slate-700 uppercase">
                  Rapat: {selectedTask.meetingDate}
                </div>
                <div className="px-3 py-1 rounded-full text-[8px] font-black border border-slate-200 bg-white text-slate-700 uppercase">
                  Target: {selectedTask.dueDate}
                </div>
              </div>
            </div>

            <h3 className="text-xl lg:text-2xl font-black text-slate-900 leading-tight">
              {selectedTask.title}
            </h3>
          </div>

          {/* UPDATE SECTION */}
          {selectedTask.status !== TaskStatus.CLOSED && canUpdate && (
            <div className="p-4 lg:p-6 border-t border-slate-100 bg-white relative">

              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />

              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  {statusOptions.map(s => (
                    <button 
                      key={s}
                      onClick={() => setTargetStatus(s)}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border ${
                        targetStatus === s 
                          ? 'bg-slate-900 text-white border-slate-900' 
                          : 'bg-white text-slate-600 border-slate-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <input
                    ref={inputRef}
                    type="text"
                    value={updateText}
                    onChange={handleTextChange}
                    placeholder="Tulis update progres..."
                    className="flex-1 px-6 py-4 rounded-2xl bg-slate-50 border"
                  />

                  <button
                    onClick={handleAddUpdate}
                    className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs"
                  >
                    Kirim Update
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          Pilih Mandat
        </div>
      )}
    </div>
  </div>
);
}

export default TaskList;
