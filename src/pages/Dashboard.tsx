import React, { useState, useMemo, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { Task, User, RACIMatrix} from '../types'
import { TaskStatus } from '../types'
import { geminiService } from '../services/geminiService'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/apiService'

const Dashboard: React.FC = () => {
  const { token, user } = useAuth()

  const [tasks, setTasks] = useState<Task[]>([])
  const [demographyData, setDemographyData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [meetingSummary, setMeetingSummary] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showClosed, setShowClosed] = useState(false)
  const [isEditingRaci, setIsEditingRaci] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterUnit, setFilterUnit] = useState('')

  // ============================
  // FETCH API
  // ============================
  // useEffect(() => {
  //   if (!token) return

  //   const fetchData = async () => {
  //     try {
  //       setLoading(true)

  //       const [taskRes, leaderRes] = await Promise.all([
  //         api.getTasks(token, searchQuery, Number(filterUnit)),
  //         api.getLeaderDemography(token)
         
  //       ])

  //       setTasks(Array.isArray(taskRes) ? taskRes : [])
  //       setDemographyData(Array.isArray(leaderRes) ? leaderRes : [])
  //     } catch (err) {
  //       console.error('Dashboard fetch error:', err)
  //     } finally {
  //       setLoading(false)
  //     }
  //   }

  //   fetchData()
  // }, [token])

  useEffect(() => {
  if (!token) return

  const fetchData = async () => {
    try {
      // setLoading(true)

      const [taskRes, leaderRes] = await Promise.all([
        api.getTasks(
          token,
          searchQuery,
          filterUnit ? Number(filterUnit) : undefined
        ),
        api.getLeaderDemography(token)
      ])

      setTasks(Array.isArray(taskRes) ? taskRes : [])
      setDemographyData(Array.isArray(leaderRes) ? leaderRes : [])
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  fetchData()
}, [token, searchQuery, filterUnit])

  const selectedTask = useMemo(
    () => tasks.find(t => t.id === selectedTaskId) || null,
    [tasks, selectedTaskId]
  )

  const stats = useMemo(
    () => ({
      total: tasks.length,
      onTrack: tasks.filter(t => t.status === TaskStatus.ON_TRACK).length,
      inProgress: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
      stagnant: tasks.filter(t => t.status === TaskStatus.STAGNANT).length,
      pendingClosing: tasks.filter(t => t.status === TaskStatus.PENDING_CLOSING).length,
      closed: tasks.filter(t => t.status === TaskStatus.CLOSED).length,
    }),
    [tasks]
  )

//   const demographyData = useMemo(() => {
//   if (!tasks.length) return []

//   const map: Record<string, any> = {}

//   tasks.forEach(task => {
//     const leader = task.raci?.accountable
//     if (!leader) return

//     if (!map[leader.id]) {
//       map[leader.id] = {
//         id: leader.id,
//         name: leader.name?.split(' ')[0] || 'User',
//         fullName: leader.name,
//         division: leader.division || leader.role,
//         photoUrl: leader.photoUrl,
//         avatar_seed: leader.avatar_seed,

//         [TaskStatus.ON_TRACK]: 0,
//         [TaskStatus.IN_PROGRESS]: 0,
//         [TaskStatus.PENDING]: 0,
//         [TaskStatus.STAGNANT]: 0,
//         [TaskStatus.PENDING_CLOSING]: 0,
//         [TaskStatus.CLOSED]: 0,
//       }
//     }

//     map[leader.id][task.status] += 1
//   })

//   return Object.values(map)
// }, [tasks])

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchSearch = task.title
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())

      const matchUnit =
        filterUnit === '' ||
        task.raci?.accountable?.id === filterUnit

      return matchSearch && matchUnit
    })
  }, [tasks, searchQuery, filterUnit])

  const COLORS: Record<string, string> = {
    [TaskStatus.ON_TRACK]: '#10b981',
    [TaskStatus.IN_PROGRESS]: '#3b82f6',
    [TaskStatus.PENDING]: '#f59e0b',
    [TaskStatus.STAGNANT]: '#ef4444',
    [TaskStatus.PENDING_CLOSING]: '#6366f1',
    [TaskStatus.CLOSED]: '#94a3b8',
  }

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.CLOSED:
        return 'bg-slate-200 text-slate-800 border-slate-300'
      case TaskStatus.PENDING_CLOSING:
        return 'bg-indigo-100 text-indigo-900 border-indigo-200'
      case TaskStatus.STAGNANT:
        return 'bg-red-100 text-red-900 border-red-200'
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-900 border-blue-200'
      case TaskStatus.PENDING:
        return 'bg-amber-100 text-amber-900 border-amber-200'
      case TaskStatus.ON_TRACK:
        return 'bg-emerald-100 text-emerald-900 border-emerald-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const activeTasks = useMemo(() => {
    return filteredTasks.filter(
      (t) => t.status !== TaskStatus.CLOSED
    )
  }, [filteredTasks])

  const closedTasks = useMemo(() => {
    return filteredTasks.filter(
      (t) => t.status === TaskStatus.CLOSED
    )
  }, [filteredTasks])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold">
        Loading Dashboard...
      </div>
    )
  }

  if (!user) return null

  // const renderTaskTable = (title: string, taskGroup: Task[], accentColor: string) => (
  //   <div className="mt-8 space-y-4">
  //     <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-2 gap-4">
  //       <div className="flex items-center gap-3">
  //         <div className={`w-3 h-3 rounded-full ${accentColor}`}></div>
  //         <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">{title} ({taskGroup.length})</h3>
  //       </div>
  //       {title.includes('Pipeline') && currentUser.role === 'SECRETARY' && (
  //         <button 
  //           onClick={() => setShowClosed(!showClosed)}
  //           className={`w-full sm:w-auto px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${showClosed ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'}`}
  //         >
  //           {showClosed ? 'Sembunyikan Arsip' : 'Lihat Mandat Selesai'}
  //         </button>
  //       )}
  //     </div>
  //     <div className="overflow-x-auto custom-scrollbar pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
  //       <table className="w-full border-separate border-spacing-y-3 min-w-[1100px] lg:min-w-full">
  //         <thead>
  //           <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-left">
  //             <th className="px-4 py-2 text-center w-12">#</th>
  //             <th className="px-6 py-2">Agenda Mandate</th>
  //             <th className="px-4 py-2 text-center w-32">Rapat</th>
  //             <th className="px-4 py-2">Accountable</th>
  //             <th className="px-4 py-2 text-center w-32">Due Date</th>
  //             <th className="px-4 py-2 text-center w-32">Status</th>
  //             <th className="px-4 py-2 text-right w-28">Action</th>
  //           </tr>
  //         </thead>
  //         <tbody>
  //           {taskGroup.map((task, index) => (
  //             <tr key={task.id} className="bg-white hover:bg-slate-50 transition-all border border-slate-100 shadow-sm group">
  //               <td className="px-4 py-5 rounded-l-[30px] border-y border-l border-slate-100 text-center font-black text-slate-400 text-[10px]">
  //                 {index + 1}
  //               </td>
  //               <td className="px-6 py-5 border-y border-slate-100 max-w-xs">
  //                 <span className="text-sm font-bold text-slate-900 line-clamp-2">{task.title}</span>
  //               </td>
  //               <td className="px-4 py-5 border-y border-slate-100 text-center text-xs font-bold text-slate-600">
  //                 {task.meetingDate}
  //               </td>
  //               <td className="px-4 py-5 border-y border-slate-100">
  //                  <div className="flex items-center gap-2">
  //                     <img src={task.raci.accountable.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.raci.accountable.avatar_seed}`} className="w-8 h-8 rounded-lg object-cover border border-slate-100" />
  //                     <span className="text-xs font-bold text-slate-800">{task.raci.accountable.name.split(' ')[0]}</span>
  //                  </div>
  //               </td>
  //               <td className="px-4 py-5 border-y border-slate-100 text-center text-xs font-black text-blue-700">
  //                 {task.dueDate}
  //               </td>
  //               <td className="px-4 py-5 border-y border-slate-100 text-center">
  //                 <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${getStatusColor(task.status)}`}>
  //                   {task.status}
  //                 </span>
  //               </td>
  //               <td className="px-4 py-5 rounded-r-[30px] border-y border-r border-slate-100 text-right">
  //                 <button onClick={() => { setSelectedTaskId(task.id); setIsEditingRaci(false); }} className="px-6 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase hover:bg-blue-700 transition-all shadow-md">Detail</button>
  //               </td>
  //             </tr>
  //           ))}
  //         </tbody>
  //       </table>
  //     </div>
  //   </div>
  // );

  // ============================
  // UI
  // ============================

  const renderTaskTable = (
  title: string,
  taskGroup: Task[],
  accentColor: string
) => (
  <div className="mt-8 space-y-4">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-2 gap-4">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${accentColor}`}></div>
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">
          {title} ({taskGroup.length})
        </h3>
      </div>

      {title.includes('Pipeline') && user?.role === 'SECRETARY' && (
        <button
          onClick={() => setShowClosed(!showClosed)}
          className={`w-full sm:w-auto px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${
            showClosed
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
          }`}
        >
          {showClosed ? 'Sembunyikan Arsip' : 'Lihat Mandat Selesai'}
        </button>
      )}
    </div>

    <div className="overflow-x-auto custom-scrollbar pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
      <table className="w-full border-separate border-spacing-y-3 min-w-[1100px] lg:min-w-full">
        <thead>
          <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-left">
            <th className="px-4 py-2 text-center w-12">#</th>
            <th className="px-6 py-2">Agenda Mandate</th>
            <th className="px-4 py-2 text-center w-32">Rapat</th>
            <th className="px-4 py-2">Accountable</th>
            <th className="px-4 py-2 text-center w-32">Due Date</th>
            <th className="px-4 py-2 text-center w-32">Status</th>
            <th className="px-4 py-2 text-right w-28">Action</th>
          </tr>
        </thead>

        <tbody>
          {taskGroup.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center py-10 text-slate-400 font-bold">
                Tidak ada mandate
              </td>
            </tr>
          )}

          {taskGroup.map((task, index) => (
            <tr
              key={task.id}
              className="bg-white hover:bg-slate-50 transition-all border border-slate-100 shadow-sm group"
            >
              <td className="px-4 py-5 rounded-l-[30px] border-y border-l border-slate-100 text-center font-black text-slate-400 text-[10px]">
                {index + 1}
              </td>

              <td className="px-6 py-5 border-y border-slate-100 max-w-xs">
                <span className="text-sm font-bold text-slate-900 line-clamp-2">
                  {task.title}
                </span>
              </td>

              <td className="px-4 py-5 border-y border-slate-100 text-center text-xs font-bold text-slate-600">
                {task.meetingDate}
              </td>

              <td className="px-4 py-5 border-y border-slate-100">
                <div className="flex items-center gap-2">
                  <img
                    src={
                      task.raci.accountable.photoUrl ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.raci.accountable.avatar_seed}`
                    }
                    className="w-8 h-8 rounded-lg object-cover border border-slate-100"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    {task.raci.accountable.name.split(' ')[0]}
                  </span>
                </div>
              </td>

              <td className="px-4 py-5 border-y border-slate-100 text-center text-xs font-black text-blue-700">
                {task.dueDate}
              </td>

              <td className="px-4 py-5 border-y border-slate-100 text-center">
                <span
                  className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${getStatusColor(
                    task.status
                  )}`}
                >
                  {task.status}
                </span>
              </td>

              <td className="px-4 py-5 rounded-r-[30px] border-y border-r border-slate-100 text-right">
                <button
                  onClick={() => {
                    setSelectedTaskId(task.id)
                    setIsEditingRaci(false)
                  }}
                  className="px-6 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase hover:bg-blue-700 transition-all shadow-md"
                >
                  Detail
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 text-slate-900">
      {previewImage && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4" onClick={() => setPreviewImage(null)}>
           <img src={previewImage} className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl border-4 border-white/10" alt="Preview" />
        </div>
      )}
      {/* HERO */}
      <div className="bg-white p-6 sm:p-8 rounded-[40px] border border-slate-200 shadow-xl overflow-hidden relative">
        <div className="flex flex-col lg:flex-row items-center gap-8 relative z-10">
          <div className="flex-1 space-y-4 text-center lg:text-left">
             <p className="text-[10px] font-black text-blue-700 uppercase tracking-[0.3em]">Watchlist BOD Concern</p>
             <h2 className="text-2xl font-black text-slate-900 leading-tight">Executive Dashboard Monitoring</h2>
             {meetingSummary && <div className="bg-slate-50 p-6 rounded-3xl text-sm border border-slate-100 text-slate-900 italic font-medium">"{meetingSummary}"</div>}
          </div>
          <button 
            onClick={async () => {
              setIsGenerating(true); 
              setMeetingSummary(await geminiService.generateMeetingOpenerSummary(tasks)); 
              setIsGenerating(false);
            }} 
            disabled={isGenerating}
            className="w-full lg:w-auto bg-slate-900 text-white px-10 py-5 rounded-[24px] font-black text-sm shadow-2xl hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {isGenerating ? 'Analyzing...' : 'Generate Executive Summary'}
          </button>
        </div>
      </div>

      {/* CHART */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 bg-white p-6 sm:p-8 rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
           <h3 className="text-xl font-black text-slate-900 mb-8">Demografi Status Mandat Per Unit/Leader</h3>
           <div className="space-y-4 overflow-x-auto no-scrollbar">
              <div className="min-w-[650px]">
                <div className="grid grid-cols-8 text-[8px] font-black text-slate-400 uppercase tracking-widest px-2 mb-4 border-b border-slate-50 pb-2">
                  <div className="col-span-3">Unit / Leader Name</div>
                  <div className="text-center">On Track</div>
                  <div className="text-center">Progress</div>
                  <div className="text-center">Pending</div>
                  <div className="text-center">Stagnant</div>
                  <div className="text-center">Closing</div>
                </div>
                <div className="space-y-2">
                  {demographyData.map((data) => (
                    <div key={data.id} className="grid grid-cols-8 items-center p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-blue-200 transition-all group">
                      <div className="col-span-3 flex items-center gap-3">
                        <img src={data.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.avatar_seed}`} className="w-8 h-8 rounded-lg object-cover border border-slate-200" alt="" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-slate-800 leading-tight truncate">{data.name}</p>
                          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{data.division}</p>
                        </div>
                      </div>
                      <div className="text-center font-black text-xs text-emerald-600">{data[TaskStatus.ON_TRACK]}</div>
                      <div className="text-center font-black text-xs text-blue-600">{data[TaskStatus.IN_PROGRESS]}</div>
                      <div className="text-center font-black text-xs text-amber-600">{data[TaskStatus.PENDING]}</div>
                      <div className="text-center font-black text-xs text-red-600 font-bold">{data[TaskStatus.STAGNANT]}</div>
                      <div className="text-center font-black text-xs text-indigo-600">{data[TaskStatus.PENDING_CLOSING]}</div>
                    </div>
                  ))}
                </div>
              </div>
           </div>
        </div>
        
        <div className="xl:col-span-4 bg-white p-6 sm:p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col">
           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 text-center">Mandate Health Trend Line</h4>
           <div className="flex-1 min-h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={demographyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{fontSize: 9, fontWeight: 900}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 9, fontWeight: 900}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '8px', fontWeight: 'bold', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey={TaskStatus.ON_TRACK} stroke={COLORS[TaskStatus.ON_TRACK]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey={TaskStatus.IN_PROGRESS} stroke={COLORS[TaskStatus.IN_PROGRESS]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey={TaskStatus.STAGNANT} stroke={COLORS[TaskStatus.STAGNANT]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey={TaskStatus.PENDING_CLOSING} stroke={COLORS[TaskStatus.PENDING_CLOSING]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
           </div>
           <div className="text-center mt-6 pt-6 border-t border-slate-100">
              <p className="text-4xl font-black text-slate-900">{stats.total}</p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Board Mandates</p>
           </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white p-4 sm:p-6 rounded-[30px] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" 
            placeholder="Cari agenda atau mandat..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          
            className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 transition-all"
          />
        </div>
        <div className="w-full md:w-80">
          <select 
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value)}
            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 transition-all cursor-pointer"
          >
            <option value="">Semua Unit Penanggung Jawab</option>
            {demographyData.map(u => <option key={u.id} value={u.id}>{u.name} ({u.division})</option>)}
          </select>
        </div>
      </div>

      {/* <div className="space-y-8">
        {renderTaskTable('Active Follow-up Pipeline', filteredTasks.filter(t => t.status !== TaskStatus.CLOSED), 'bg-blue-600')}
        {showClosed && renderTaskTable('Closed & Archived Mandates', filteredTasks.filter(t => t.status === TaskStatus.CLOSED), 'bg-slate-400')}
      </div> */}

      <div className="space-y-8">
  {renderTaskTable(
    'Active Follow-up Pipeline',
    activeTasks,
    'bg-blue-600'
  )}

  {showClosed &&
    renderTaskTable(
      'Closed & Archived Mandates',
      closedTasks,
      'bg-slate-400'
    )}
</div>
      {/* {selectedTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-4xl h-[95vh] sm:h-[85vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black">ID</div>
                   <div>
                      <p className="text-[9px] font-black text-blue-700 uppercase tracking-widest">Detail Mandat</p>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 line-clamp-1">{selectedTask.title}</h3>
                   </div>
                 </div>
                 <button onClick={() => setSelectedTaskId(null)} className="w-10 h-10 bg-slate-100 text-slate-800 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-all">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar">
                 <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Deskripsi Tugas</h4>
                    <p className="text-sm text-slate-800 leading-relaxed font-medium">{selectedTask.description}</p>
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">RACI Matrix (PJ)</h4>
                      {(currentUser.role === 'SECRETARY' || currentUser.id === selectedTask.raci.accountable.id) && (
                        <button onClick={() => setIsEditingRaci(!isEditingRaci)} className="text-[9px] font-black text-blue-700 uppercase underline">
                          Update PJ
                        </button>
                      )}
                    </div>

                    {isEditingRaci ? (
                      <div className="bg-slate-50 p-6 rounded-3xl border border-blue-200 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in zoom-in duration-200">
                         <div className="space-y-2">
                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Accountable</label>
                            <select 
                              className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold"
                              value={selectedTask.raci.accountable.id}
                              onChange={(e) => {
                                const newAcc = users.find(u => u.id === e.target.value)!;
                                onUpdateRACI(selectedTask.id, { ...selectedTask.raci, accountable: newAcc });
                              }}
                            >
                              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                         </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                          <p className="text-[8px] font-black text-blue-700 uppercase mb-2">Accountable (A)</p>
                          <div className="flex items-center gap-2">
                            <img src={selectedTask.raci.accountable.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedTask.raci.accountable.avatar_seed}`} className="w-8 h-8 rounded-xl border border-slate-200 shadow-sm object-cover" alt="" />
                            <p className="text-xs font-bold text-slate-900 truncate">{selectedTask.raci.accountable.name}</p>
                          </div>
                        </div>
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                           <p className="text-[8px] font-black text-slate-500 uppercase mb-2">Rapat</p>
                           <p className="text-xs font-black text-slate-600">{selectedTask.meetingDate}</p>
                        </div>
                        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                           <p className="text-[8px] font-black text-slate-500 uppercase mb-2">Due Date</p>
                           <p className="text-xs font-black text-blue-700">{selectedTask.dueDate}</p>
                        </div>
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                           <p className="text-[8px] font-black text-slate-500 uppercase mb-2">Status</p>
                           <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${getStatusColor(selectedTask.status)}`}>{selectedTask.status}</span>
                        </div>
                      </div>
                    )}
                 </div>

                 <div className="space-y-4">
                    <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Log Aktivitas Progres</h4>
                    {selectedTask.updates.length > 0 ? selectedTask.updates.map(u => (
                       <div key={u.id} className="flex gap-4 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                          <img src={u.user.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.user.avatar_seed}`} className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 object-cover" alt="" />
                          <div className="flex-1">
                             <div className="flex justify-between items-center mb-1">
                                <p className="text-[10px] font-black text-slate-900">{u.user.name}</p>
                                <p className="text-[8px] font-bold text-slate-400">{new Date(u.date).toLocaleDateString()}</p>
                             </div>
                             <p className="text-xs text-slate-800 font-medium leading-relaxed">{u.content}</p>
                          </div>
                       </div>
                    )) : (
                      <div className="text-center py-10 text-[10px] font-black text-slate-400 uppercase italic">Belum ada progres tercatat</div>
                    )}
                 </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-center">
                <button 
                  onClick={() => setSelectedTaskId(null)}
                  className="w-full sm:w-auto bg-slate-900 text-white px-16 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-slate-800 transition-all active:scale-95 transform"
                >
                  TUTUP DETAIL
                </button>
              </div>
           </div>
        </div>
      )} */}
    </div>
  )
}

export default Dashboard