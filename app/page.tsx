'use client';
export const dynamic = "force-dynamic";

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase'; // ✅ fixed name

interface Bookmark {
  id: number;
  title: string;
  url: string;
  user_id: string;
}

export default function Home() {

  const supabase = getSupabaseClient(); // ✅ THIS LINE ADDED (very important)

  const [user, setUser] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [realtimeAvailable, setRealtimeAvailable] = useState(true);

  // --- Check user on load ---
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser(data.user);
        fetchBookmarks(data.user.id);
      }
    };

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setBookmarks([]);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // --- Fetch bookmarks ---
  const fetchBookmarks = async (userId: string) => {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) setBookmarks(data as Bookmark[]);
  };

  // --- Polling fallback every 2 seconds ---
  useEffect(() => {
    if (!user || !realtimeAvailable) return;

    const interval = setInterval(() => {
      fetchBookmarks(user.id);
    }, 2000);

    return () => clearInterval(interval);
  }, [user, realtimeAvailable]);

  // --- Optional Realtime subscription ---
  useEffect(() => {
    if (!user) return;

    let channel: any;

    try {
      channel = supabase
        .channel(`realtime-bookmarks-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'bookmarks',
            filter: `user_id=eq.${user.id}`,
          },
          payload => setBookmarks(prev => [payload.new as Bookmark, ...prev])
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'bookmarks',
            filter: `user_id=eq.${user.id}`,
          },
          payload => setBookmarks(prev =>
            prev.filter(b => b.id !== (payload.old as Bookmark).id)
          )
        )
        .subscribe();
    } catch (err) {
      console.warn('Realtime failed, falling back to polling', err);
      setRealtimeAvailable(false);
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user]);

  // --- Login / Logout ---
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setBookmarks([]);
  };

  // --- Add bookmark ---
  const addBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert('Login first!');
    if (!title || !url) return alert('Enter both title and URL');

    const { data, error } = await supabase
      .from('bookmarks')
      .insert([{ user_id: user.id, title, url }])
      .select();

    if (error || !data || data.length === 0) {
      alert('Error adding bookmark');
    } else {
      setBookmarks([data[0] as Bookmark, ...bookmarks]);
      setTitle('');
      setUrl('');
    }
  };

  // --- Delete bookmark ---
  const deleteBookmark = async (id: number) => {
    await supabase.from('bookmarks').delete().eq('id', id);
    setBookmarks(bookmarks.filter(b => b.id !== id));
  };

  // --- UI ---
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-4 p-10">
        <h1 className="text-2xl font-bold mb-4">Smart Bookmark App</h1>
        <button
          onClick={handleLogin}
          className="bg-black text-white px-6 py-3 rounded-lg"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-10 gap-6">
      <h2 className="text-xl font-bold">Welcome {user.email}</h2>

      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-6 py-2 rounded-lg"
      >
        Logout
      </button>

      <form onSubmit={addBookmark} className="flex flex-col gap-2 w-full max-w-md">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="url"
          placeholder="URL"
          value={url}
          onChange={e => setUrl(e.target.value)}
          className="border p-2 rounded"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Add Bookmark
        </button>
      </form>

      <div className="w-full max-w-md">
        <h3 className="text-lg font-semibold mb-2">Your Bookmarks:</h3>
        {bookmarks.length === 0 ? (
          <p>No bookmarks yet</p>
        ) : (
          <ul className="space-y-2">
            {bookmarks.map(b => (
              <li
                key={b.id}
                className="p-3 border rounded-lg flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{b.title}</p>
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline"
                  >
                    {b.url}
                  </a>
                </div>
                <button
                  onClick={() => deleteBookmark(b.id)}
                  className="text-red-500 ml-4"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
