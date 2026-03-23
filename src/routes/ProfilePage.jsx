import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/client';
import { useAuth } from '../contexts/useAuth';
import Post from '../components/Post';
import RelativeTime from '../components/RelativeTime';

const ProfilePage = () => {
  const { userId } = useParams();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Tab data
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [upvotedPosts, setUpvotedPosts] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);

  const isOwnProfile = user?.id === userId;

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) console.error('Error fetching profile:', error);
        setProfile(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  // Fetch tab data when tab changes
  useEffect(() => {
    const fetchTabData = async () => {
      setTabLoading(true);
      try {
        if (activeTab === 'overview') {
          const { data, error } = await supabase
            .from('posts')
            .select('*, profiles!posts_author_id_fkey(username, avatar_url)')
            .eq('author_id', userId)
            .order('created_at', { ascending: false });
          if (error) console.error('Error fetching posts:', error);
          setPosts(data || []);
        } else if (activeTab === 'comments') {
          const { data, error } = await supabase
            .from('comments')
            .select('id, comment, created_at, post_id, posts!post_id(title, slug)')
            .eq('author_id', userId)
            .order('created_at', { ascending: false });
          if (error) console.error('Error fetching comments:', error);
          setComments(data || []);
        } else if (activeTab === 'upvoted') {
          const { data, error } = await supabase
            .from('upvotes')
            .select('posts(*, profiles!posts_author_id_fkey(username, avatar_url))')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error fetching upvoted posts:', error);
            setUpvotedPosts([]);
          } else {
            setUpvotedPosts((data || []).map(u => u.posts).filter(Boolean));
          }
        }
      } catch (err) {
        console.error('Error fetching tab data:', err);
      } finally {
        setTabLoading(false);
      }
    };

    if (userId) fetchTabData();
  }, [activeTab, userId]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/purpleit/', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="container py-5">
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <i className="bi bi-person-x display-1 text-muted mb-3 d-block"></i>
          <h3 className="mb-3">User not found</h3>
          <Link to="/purpleit/" className="btn btn-primary">
            <i className="bi bi-arrow-left me-2"></i>Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'overview', label: 'Overview', icon: 'bi-grid' },
    { key: 'comments', label: 'Comments', icon: 'bi-chat-dots' },
    { key: 'upvoted', label: 'Upvoted', icon: 'bi-arrow-up-circle' },
  ];

  return (
    <div className="container py-4">
      <Link to="/purpleit/" className="btn btn-outline-secondary mb-3">
        <i className="bi bi-arrow-left me-2"></i>Back to Posts
      </Link>

      <div className="card mb-4 border-0 bg-transparent">
        <div className="card-body p-4">
          <div className="d-flex align-items-center flex-wrap gap-3">
            <div className="profile-avatar-wrapper me-3">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username || 'User'}
                  className="profile-avatar rounded-circle"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="profile-avatar-placeholder rounded-circle d-flex align-items-center justify-content-center bg-primary text-white">
                  <i className="bi bi-person-fill display-6"></i>
                </div>
              )}
            </div>

            <div className="flex-grow-1">
              <h3 className="fw-bold mb-1 text-break">{profile.username || 'Anonymous User'}</h3>
              <small className="text-muted">
                <i className="bi bi-calendar3 me-1"></i>
                Member since {profile.created_at
                  ? new Date(profile.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    })
                  : 'Unknown'}
              </small>
            </div>

            {isOwnProfile && (
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>

      <ul className="nav nav-tabs nav-fill mb-4">
        {tabs.map(tab => (
          <li className="nav-item" key={tab.key}>
            <button
              className={`nav-link ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {tabLoading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <div>
              {posts.length > 0 ? (
                posts.map(item => (
                  <Post
                    key={item.slug}
                    slug={item.slug}
                    createdAt={item.created_at}
                    title={item.title}
                    upvotes={item.upvotes}
                    isEdited={item.updated_at && new Date(item.updated_at).getTime() > new Date(item.created_at).getTime()}
                    hasUpvoted={false}
                    authorUsername={item.profiles?.username}
                    authorAvatarUrl={item.profiles?.avatar_url}
                    authorId={item.author_id}
                  />
                ))
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-inbox display-4 text-muted d-block mb-3"></i>
                  <p className="text-muted">No posts yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div>
              {comments.length > 0 ? (
                comments.map(item => (
                  <div key={item.id} className="card mb-3">
                    <div className="card-body">
                      <Link
                        to={`/purpleit/${item.posts?.slug || item.post_id}`}
                        className="text-primary text-decoration-none fw-semibold d-block mb-1"
                      >
                        <i className="bi bi-chat-quote me-1"></i>
                        {item.posts?.title || '[deleted post]'}
                      </Link>

                      <small className="text-muted d-block mb-2">
                        {profile?.username || 'User'} commented <RelativeTime time={item.created_at} />
                      </small>

                      <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{item.comment}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-chat display-4 text-muted d-block mb-3"></i>
                  <p className="text-muted">No comments yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'upvoted' && (
            <div>
              {upvotedPosts.length > 0 ? (
                upvotedPosts.map(item => (
                  <Post
                    key={item.slug}
                    slug={item.slug}
                    createdAt={item.created_at}
                    title={item.title}
                    upvotes={item.upvotes}
                    isEdited={item.updated_at && new Date(item.updated_at).getTime() > new Date(item.created_at).getTime()}
                    hasUpvoted={true}
                    authorUsername={item.profiles?.username}
                    authorAvatarUrl={item.profiles?.avatar_url}
                    authorId={item.author_id}
                  />
                ))
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-arrow-up-circle display-4 text-muted d-block mb-3"></i>
                  <p className="text-muted">No upvoted posts yet</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProfilePage;
