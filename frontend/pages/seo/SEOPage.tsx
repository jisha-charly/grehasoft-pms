import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { SEOTask, SEOKeyword, SEOOnPage, GMBProfile, SocialMediaPost, SocialMetric } from '../../types';

const SEOPage: React.FC = () => {
  const [seoTasks, setSeoTasks] = useState<SEOTask[]>([]);
  const [keywords, setKeywords] = useState<SEOKeyword[]>([]);
  const [onPageData, setOnPageData] = useState<SEOOnPage[]>([]);
  const [gmbProfiles, setGmbProfiles] = useState<GMBProfile[]>([]);
  const [socialPosts, setSocialPosts] = useState<SocialMediaPost[]>([]);
  const [socialMetrics, setSocialMetrics] = useState<SocialMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, kwRes, onPageRes, gmbRes, postsRes, metricsRes] = await Promise.all([
          axiosInstance.get('/seo-tasks'),
          axiosInstance.get('/seo-keywords'),
          axiosInstance.get('/seo-onpage'),
          axiosInstance.get('/gmb-profiles'),
          axiosInstance.get('/social-media-posts'),
          axiosInstance.get('/social-metrics')
        ]);
        setSeoTasks(tasksRes.data);
        setKeywords(kwRes.data);
        setOnPageData(onPageRes.data);
        setGmbProfiles(gmbRes.data);
        setSocialPosts(postsRes.data);
        setSocialMetrics(metricsRes.data);
      } catch (error) {
        console.error("Error fetching SEO data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>;

  return (
    <div className="container-fluid p-0">
      <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="fw-bold mb-0 text-dark">SEO & Social Performance</h4>
            <div className="btn-group">
              <button className="btn btn-outline-primary btn-sm fw-bold">Export Report</button>
              <button className="btn btn-primary btn-sm fw-bold">Add SEO Task</button>
            </div>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="col-md-3">
          <div className="card p-4 border-0 shadow-sm rounded-4 bg-white">
            <div className="d-flex align-items-center mb-2">
              <div className="bg-primary-subtle p-2 rounded-3 me-3"><i className="bi bi-graph-up text-primary"></i></div>
              <div className="text-secondary smaller fw-bold uppercase">ON-PAGE SCORE</div>
            </div>
            <h2 className="fw-bold mb-0 text-dark">82%</h2>
            <div className="smaller text-success fw-bold mt-1"><i className="bi bi-arrow-up me-1"></i>+4% from last month</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-4 border-0 shadow-sm rounded-4 bg-white">
            <div className="d-flex align-items-center mb-2">
              <div className="bg-success-subtle p-2 rounded-3 me-3"><i className="bi bi-lightning text-success"></i></div>
              <div className="text-secondary smaller fw-bold uppercase">AVG LCP</div>
            </div>
            <h2 className="fw-bold mb-0 text-dark">1.2s</h2>
            <div className="smaller text-success fw-bold mt-1"><i className="bi bi-check-circle me-1"></i>Optimized</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-4 border-0 shadow-sm rounded-4 bg-white">
            <div className="d-flex align-items-center mb-2">
              <div className="bg-info-subtle p-2 rounded-3 me-3"><i className="bi bi-trophy text-info"></i></div>
              <div className="text-secondary smaller fw-bold uppercase">RANKINGS UP</div>
            </div>
            <h2 className="fw-bold mb-0 text-dark">24</h2>
            <div className="smaller text-info fw-bold mt-1">Keywords in Top 10</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-4 border-0 shadow-sm rounded-4 bg-white">
            <div className="d-flex align-items-center mb-2">
              <div className="bg-warning-subtle p-2 rounded-3 me-3"><i className="bi bi-shield-check text-warning"></i></div>
              <div className="text-secondary smaller fw-bold uppercase">SPAM SCORE</div>
            </div>
            <h2 className="fw-bold mb-0 text-dark">0.5%</h2>
            <div className="smaller text-success fw-bold mt-1">Healthy Profile</div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* SEO Tasks */}
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="card-header bg-white border-0 py-3 px-4">
              <h6 className="fw-bold mb-0">Active SEO Tasks</h6>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="px-4 border-0 smaller fw-bold text-secondary">TASK ID</th>
                    <th className="border-0 smaller fw-bold text-secondary">SEO TYPE</th>
                    <th className="border-0 smaller fw-bold text-secondary">CREATED AT</th>
                    <th className="text-end px-4 border-0 smaller fw-bold text-secondary">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {seoTasks.map(task => (
                    <tr key={task.id}>
                      <td className="px-4 fw-bold text-dark">#{task.task_id}</td>
                      <td><span className="badge bg-info-subtle text-info text-uppercase">{task.seo_type.replace('_', ' ')}</span></td>
                      <td>{new Date(task.createdAt).toLocaleDateString()}</td>
                      <td className="text-end px-4"><span className="badge bg-success">Active</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Keyword Rankings */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="card-header bg-white border-0 py-3 px-4 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0">Keyword Rankings</h6>
              <button className="btn btn-light btn-sm fw-bold">View All</button>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="px-4 border-0 smaller fw-bold text-secondary">KEYWORD</th>
                    <th className="border-0 smaller fw-bold text-secondary">VOLUME</th>
                    <th className="border-0 smaller fw-bold text-secondary">DIFFICULTY</th>
                    <th className="border-0 smaller fw-bold text-secondary">RANK</th>
                    <th className="border-0 smaller fw-bold text-secondary">TARGET</th>
                    <th className="text-end px-4 border-0 smaller fw-bold text-secondary">TREND</th>
                  </tr>
                </thead>
                <tbody>
                  {keywords.map(kw => (
                    <tr key={kw.id}>
                      <td className="px-4 fw-bold text-dark">{kw.keyword}</td>
                      <td>{kw.search_volume.toLocaleString()}</td>
                      <td>
                        <div className="progress" style={{ height: '6px', width: '60px' }}>
                          <div className={`progress-bar ${kw.difficulty > 70 ? 'bg-danger' : kw.difficulty > 40 ? 'bg-warning' : 'bg-success'}`} style={{ width: `${kw.difficulty}%` }}></div>
                        </div>
                        <span className="smaller text-muted mt-1 d-block">{kw.difficulty}%</span>
                      </td>
                      <td><span className="badge bg-primary-subtle text-primary fw-bold">#{kw.current_rank}</span></td>
                      <td><span className="badge bg-success-subtle text-success fw-bold">#{kw.target_rank}</span></td>
                      <td className="text-end px-4">
                        <i className={`bi bi-graph-up-arrow text-success`}></i>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* GMB Profiles */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
            <h6 className="fw-bold mb-3">Google Business Profile</h6>
            {gmbProfiles.map(gmb => (
              <div key={gmb.id} className="d-flex align-items-center p-3 bg-light rounded-3 mb-3">
                <div className="bg-white p-2 rounded-circle shadow-sm me-3"><i className="bi bi-google text-primary"></i></div>
                <div>
                  <div className="fw-bold text-dark small">{gmb.business_name}</div>
                  <div className="smaller text-muted">{gmb.category}</div>
                  <div className="d-flex align-items-center mt-1">
                    <span className="text-warning me-1"><i className="bi bi-star-fill"></i></span>
                    <span className="fw-bold smaller me-2">{gmb.rating}</span>
                    <span className="smaller text-muted">({gmb.total_reviews} reviews)</span>
                  </div>
                </div>
              </div>
            ))}
            <button className="btn btn-outline-primary btn-sm w-100 fw-bold">Manage Profiles</button>
          </div>

          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h6 className="fw-bold mb-3">Social Media Reach</h6>
            {socialPosts.map(post => {
              const metrics = socialMetrics.find(m => m.post_id === post.id);
              return (
                <div key={post.id} className="mb-3 pb-3 border-bottom last-child-border-0">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center">
                      <i className={`bi bi-${post.platform.toLowerCase()} text-primary me-2`}></i>
                      <span className="fw-bold small">{post.platform}</span>
                    </div>
                    <span className="smaller text-muted">{post.posting_date}</span>
                  </div>
                  <a href={post.post_url} target="_blank" rel="noreferrer" className="smaller text-primary text-decoration-none d-block mb-2 text-truncate">{post.post_url}</a>
                  <div className="d-flex gap-3">
                    <div className="smaller"><i className="bi bi-heart me-1"></i>{metrics?.likes || 0}</div>
                    <div className="smaller"><i className="bi bi-chat me-1"></i>{metrics?.comments || 0}</div>
                    <div className="smaller"><i className="bi bi-share me-1"></i>{metrics?.shares || 0}</div>
                    <div className="smaller ms-auto fw-bold text-dark"><i className="bi bi-eye me-1"></i>{metrics?.reach.toLocaleString() || 0}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SEOPage;
