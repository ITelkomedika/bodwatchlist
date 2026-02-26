
import React, { useState, useRef, useEffect } from 'react';
import { TaskStatus, type RACIMatrix, type Task, type User } from '../types';
import { api } from '../services/apiService';
import { useAuth } from '../context/AuthContext';

const TaskList: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [tempAccountableId, setTempAccountableId] = useState<number | null>(null);

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

  try {
    await api.addTaskUpdate(token, selectedTask.id, {
      content: updateText,
      status: targetStatus || undefined,
      mentions,
      evidence: evidence ?? null,
    });

    setUpdateText('');
    setTargetStatus('');
    setMentions([]);
    setEvidence(null);

    // optional: refresh task detail / updates list
    // await loadTaskDetail(selectedTask.id);

  } catch (err) {
    console.error(err);
  }
  };

  const handleSaveRaci = async () => {
  if (!selectedTask || !tempAccountableId) return;

  try {
    const updatedTask = await api.updateRaci(
      token,
      selectedTask.id,
      tempAccountableId
    );

    setTasks(prev =>
      prev.map(task =>
        task.id === selectedTask.id
          ? {
              ...task,
              raci: {
                ...task.raci,
                accountable: updatedTask.primaryAssignee,
              },
            }
          : task
      )
    );

    setIsEditingRaci(false);
    setTempAccountableId(null);
  } catch (err) {
    console.error(err);
    alert("Gagal update accountable");
  }
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
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start text-slate-900">
      {previewImage && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4" 
          onClick={() => setPreviewImage(null)}
        >
           <img src={previewImage} className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl border-4 border-white/10" alt="Preview" />
           <button className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center text-xl">✕</button>
        </div>
      )}
    <div className={`lg:col-span-3 flex flex-col space-y-3 ${selectedId ? 'hidden lg:flex' : 'flex'}`}>
      <h2 className="font-black text-slate-900 uppercase tracking-widest text-[10px] px-2">Mandat Direksi Aktif</h2>
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2 pb-6">
          {tasks.filter(t => t.status !== TaskStatus.CLOSED).map((task) => (
            <div
              key={task.id}
              onClick={() => { setSelectedId(task.id); setShowMentionPicker(false); setShowExtensionForm(false); setIsEditingRaci(false); }}
              className={`p-4 rounded-[24px] border cursor-pointer transition-all duration-300
                ${selectedId === task.id ? 'bg-white border-blue-500 shadow-lg ring-2 ring-blue-50' : 'bg-white border-slate-200 hover:border-slate-300'}
              `}
            >
              <div className="flex justify-between items-center mb-2">
                <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded border ${getStatusColor(task.status)}`}>{task.status}</span>
                <span className="text-[9px] font-bold text-slate-500">{task.dueDate}</span>
              </div>
              <h4 className={`font-bold leading-tight text-xs line-clamp-2 ${selectedId === task.id ? 'text-blue-700' : 'text-slate-800'}`}>{task.title}</h4>
            </div>
          ))}
          {tasks.filter(t => t.status !== TaskStatus.CLOSED).length === 0 && (
            <div className="text-center py-10 text-[10px] font-black text-slate-400 uppercase italic">Tidak ada mandat aktif</div>
          )}
        </div>
    </div>

    <div className={`lg:col-span-9 bg-white rounded-[40px] border border-slate-200 shadow-sm flex flex-col pb-12 ${!selectedId ? 'hidden lg:flex' : 'flex'}`}>
      {selectedTask ? (
        <>
          {/* HEADER */}
            <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/20">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <button onClick={() => setSelectedId(null)} className="text-blue-700 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-100 px-3 py-2 rounded-xl transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  KEMBALI
                </button>
                <div className="flex flex-wrap gap-2">
                  <div className={`px-3 py-1 rounded-full text-[8px] font-black border uppercase ${getStatusColor(selectedTask.status)}`}>{selectedTask.status}</div>
                  <div className="px-3 py-1 rounded-full text-[8px] font-black border border-slate-200 bg-white text-slate-700 uppercase">Rapat: {selectedTask.meetingDate}</div>
                  <div className="px-3 py-1 rounded-full text-[8px] font-black border border-slate-200 bg-white text-slate-700 uppercase">Target: {selectedTask.dueDate}</div>
                </div>
              </div>
              <h3 className="text-xl lg:text-2xl font-black text-slate-900 leading-tight">{selectedTask.title}</h3>
            </div>
            <div className="flex flex-col lg:flex-row items-start">
               <div className="lg:w-[68%] p-6 lg:p-8 space-y-6 custom-scrollbar bg-white lg:border-r border-slate-100">
                  <div className="space-y-6">
                    <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Timeline Aktivitas Progres</h4>
                    {selectedTask.updates.map((update) => (
                      <div key={update.id} className="flex gap-4 group">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${update.user.avatar_seed}`} className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 p-1" alt="" />
                        <div className={`flex-1 p-5 rounded-[24px] border ${update.content.includes('🚨') ? 'bg-red-50 border-red-200' : update.user.id === selectedTask.raci.accountable.id ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-slate-100'}`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className={`text-[10px] font-black ${update.content.includes('🚨') ? 'text-red-800' : 'text-slate-900'}`}>{update.user.name}</span>
                            <span className="text-[8px] font-bold text-slate-400">{new Date(update.date).toLocaleDateString()}</span>
                          </div>
                          <p className={`text-xs leading-relaxed font-medium ${update.content.includes('🚨') ? 'text-red-900' : 'text-slate-800'}`}>{update.content}</p>
                          {update.evidenceFileName && (
                            <div className="mt-4 flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                               <span className="text-[9px] font-bold text-slate-700 truncate max-w-[150px] sm:max-w-[250px]">📎 {update.evidenceFileName}</span>
                               <button 
                                 onClick={() => setPreviewImage(update.evidenceBase64!)} 
                                 className="text-[9px] font-black text-blue-700 uppercase hover:underline"
                               >
                                 View (Lihat)
                               </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {selectedTask.updates.length === 0 && (
                       <div className="text-center py-20 opacity-20 italic text-xs font-bold text-slate-500">Belum ada progres yang dilaporkan</div>
                    )}
                  </div>
               </div>

                <div className="w-full lg:w-[32%] bg-slate-50/50 p-6 space-y-8 self-start max-h-fit">
                <div className="space-y-3">
  <div className="flex items-center justify-between">
    <h4 className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
      Accountable (A)
    </h4>

    {(currentUser.role === 'SECRETARY' ||
      currentUser.id === selectedTask.raci.accountable.id) && (
      <button
        onClick={() => {
          setTempAccountableId(selectedTask.raci.accountable.id);
          setIsEditingRaci(true);
        }}
        className="text-[8px] font-black text-blue-700 uppercase underline"
      >
        Update
      </button>
    )}
  </div>

  {isEditingRaci ? (
    <div className="space-y-3 animate-in fade-in duration-200">
      <select
        className="w-full p-2.5 rounded-xl border border-slate-200 text-[10px] font-bold"
        value={tempAccountableId ?? ""}
        onChange={(e) => setTempAccountableId(Number(e.target.value))}
      >
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <button
          onClick={() => {
            setIsEditingRaci(false);
            setTempAccountableId(null);
          }}
          className="w-1/2 py-2 bg-slate-200 text-slate-700 rounded-lg text-[8px] font-black uppercase"
        >
          Batal
        </button>

        <button
          onClick={handleSaveRaci}
          className="w-1/2 py-2 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase"
        >
          Selesai Edit
        </button>
      </div>
    </div>
  ) : (
    <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
      <img
        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedTask.raci.accountable.avatar_seed}`}
        className="w-8 h-8 rounded-lg"
        alt=""
      />
      <div className="min-w-0">
        <p className="text-[10px] font-black text-slate-900 truncate">
          {selectedTask.raci.accountable.name}
        </p>
        <p className="text-[7px] font-bold text-blue-700 uppercase">
          Primary Owner
        </p>
      </div>
    </div>
  )}
</div>
                  {/* <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Accountable (A)</h4>
                      {(currentUser.role === 'SECRETARY' || currentUser.id === selectedTask.raci.accountable.id) && (
                        <button onClick={() => setIsEditingRaci(!isEditingRaci)} className="text-[8px] font-black text-blue-700 uppercase underline">Update</button>
                      )}
                    </div>
                    {isEditingRaci ? (
                      <div className="space-y-3 animate-in fade-in duration-200">
                         <select 
                            className="w-full p-2.5 rounded-xl border border-slate-200 text-[10px] font-bold"
                            value={selectedTask.raci.accountable.id}
                            onChange={(e) => {
                              const newAcc = users.find(u => u.id === e.target.value)!;
                              onUpdateRACI(selectedTask.id, { ...selectedTask.raci, accountable: newAcc });
                            }}
                          >
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </select>
                          <button onClick={() => setIsEditingRaci(false)} className="w-full py-2 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase">Selesai Edit</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedTask.raci.accountable.avatar_seed}`} className="w-8 h-8 rounded-lg" alt="" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-slate-900 truncate">{selectedTask.raci.accountable.name}</p>
                          <p className="text-[7px] font-bold text-blue-700 uppercase">Primary Owner</p>
                        </div>
                      </div>
                    )}
                  </div> */}

                  <div className="space-y-3">
                    <h4 className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Responsible (R)</h4>
                    <div className="flex flex-wrap gap-2">
                       {selectedTask.raci.responsible.map((r, i) => (
                         <div key={i} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 pr-3 shadow-sm">
                           <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${r.avatar_seed}`} className="w-5 h-5 rounded-md" alt="" />
                           <span className="text-[9px] font-bold text-slate-800">{r.name.split(' ')[0]}</span>
                         </div>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Status Timeline</h4>
                    <div className="bg-slate-900 text-white p-5 rounded-[24px] space-y-4 shadow-lg">
                       <div>
                         <p className="text-[7px] font-black opacity-60 uppercase text-slate-400 mb-1">Tanggal Rapat</p>
                         <p className="text-xs font-black text-blue-400 mb-4">{selectedTask.meetingDate}</p>
                         <p className="text-[7px] font-black opacity-60 uppercase">Target Selesai</p>
                         <p className="text-xs font-black text-emerald-400">{selectedTask.dueDate}</p>
                       </div>
                       {currentUser.role === 'UNIT' && selectedTask.status !== TaskStatus.CLOSED && (
                        <button onClick={() => setShowExtensionForm(!showExtensionForm)} className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-[8px] font-black uppercase transition-all border border-white/5">
                          {showExtensionForm ? 'Tutup Form' : 'Ubah Tanggal'}
                        </button>
                       )}
                    </div>
                  </div>

                  {showExtensionForm && (
                    <div className="bg-white p-5 rounded-3xl border-2 border-blue-500 shadow-xl animate-in zoom-in duration-300 space-y-4">
                      <p className="text-[9px] font-black text-slate-900 uppercase">Ubah Target Waktu</p>
                      <input type="date" value={reqDate} onChange={(e) => setReqDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-900" />
                      <textarea placeholder="Alasan perubahan..." value={reqReason} onChange={(e) => setReqReason(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-medium h-24 text-slate-800" />
                      <button onClick={submitDateChange} className="w-full py-3 bg-blue-700 text-white rounded-xl font-black text-[9px] uppercase shadow-lg hover:bg-blue-800 transition-all">Kirim Update</button>
                    </div>
                  )}
               </div>
            </div>
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
        <div className="flex-1 flex flex-col items-center justify-center p-10 sm:p-20 text-center bg-slate-50/20">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white border border-slate-200 rounded-3xl flex items-center justify-center text-3xl mb-6 shadow-sm">📂</div>
            <p className="font-black text-slate-500 uppercase tracking-[0.3em] text-[10px]">Pilih Mandat untuk Update Progres</p>
        </div>
      )}
    </div>
  </div>
);
}

export default TaskList;
