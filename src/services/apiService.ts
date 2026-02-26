const API_URL = import.meta.env.VITE_API_URL;
console.log("API_URL:", API_URL);
export const api = {
  async login(username: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
        const text = await res.text();
        console.log("LOGIN ERROR RESPONSE:", text);
        throw new Error('Login failed');
    }

    const data = await res.json();
    console.log("LOGIN SUCCESS RESPONSE:", data);
    return data;
  },

  async getTasks(token: string, search?: string,
  accountableId?: number) {
    const params = new URLSearchParams();

    if (search) params.append('search', search);
    if (accountableId) params.append('accountableId', String(accountableId));

    const res = await fetch(`${API_URL}/tasks?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    return res.json();
    // const res = await fetch(`${API_URL}/tasks`, {
    //   headers: {
    //     Authorization: `Bearer ${token}`,
    //   },
    // });

    // return res.json();
  },
  
  async getLeaderDemography(token: string) {
    const res = await fetch(`${API_URL}/users/leader-demography`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error('Failed to fetch leader demography');
    }

    return res.json();
  },

  async getUsers(token: string) {
    const res = await fetch(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async extractMeeting(token: string, notes: string) {
    const res = await fetch(`${API_URL}/meeting/extract`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes }),
    });

    if (!res.ok) {
        throw new Error('Failed to extract meeting');
    }

    return res.json();
   },

   async bulkCreateTasks(token: string, tasks: any[]) {
    const res = await fetch(`${API_URL}/tasks/bulk-create`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tasks }),
    });

    if (!res.ok) {
        throw new Error('Bulk create failed');
    }

    return res.json();
   },

   async updateRaci(token: string, taskId: number, accountableId: number) {
  const res = await fetch(`${API_URL}/tasks/${taskId}/raci`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      accountableId,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.log("UPDATE RACI ERROR:", text);
    throw new Error('Failed to update RACI');
  }

  return res.json();
},
   
};