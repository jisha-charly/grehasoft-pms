import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import {
  SEOTask,
  SEOKeyword,
  SEOOnPage,
  GMBProfile,
  SocialMediaPost,
  SocialMetric
} from '../../types';

const SEOPage: React.FC = () => {
  const [seoTasks, setSeoTasks] = useState<SEOTask[]>([]);
  const [keywords, setKeywords] = useState<SEOKeyword[]>([]);
  const [onPageData, setOnPageData] = useState<SEOOnPage[]>([]);
  const [gmbProfiles, setGmbProfiles] = useState<GMBProfile[]>([]);
  const [socialPosts, setSocialPosts] = useState<SocialMediaPost[]>([]);
  const [socialMetrics, setSocialMetrics] = useState<SocialMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const safeArray = (data: any) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          tasksRes,
          kwRes,
          onPageRes,
          gmbRes,
          postsRes,
          metricsRes
        ] = await Promise.all([
          axiosInstance.get('/seo-tasks'),
          axiosInstance.get('/seo-keywords'),
          axiosInstance.get('/seo-onpage'),
          axiosInstance.get('/gmb-profiles'),
          axiosInstance.get('/social-media-posts'),
          axiosInstance.get('/social-metrics')
        ]);

        setSeoTasks(safeArray(tasksRes.data));
        setKeywords(safeArray(kwRes.data));
        setOnPageData(safeArray(onPageRes.data));
        setGmbProfiles(safeArray(gmbRes.data));
        setSocialPosts(safeArray(postsRes.data));
        setSocialMetrics(safeArray(metricsRes.data));
      } catch (error) {
        console.error('Error fetching SEO data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">

      <h4 className="fw-bold mb-4 text-dark">SEO & Social Performance</h4>

      {/* SEO TASKS TABLE */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        <div className="card-header bg-white border-0 py-3 px-4">
          <h6 className="fw-bold mb-0">Active SEO Tasks</h6>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="px-4">Task ID</th>
                <th>SEO Type</th>
                <th>Created At</th>
                <th className="text-end px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {seoTasks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-muted">
                    No SEO tasks found.
                  </td>
                </tr>
              ) : (
                seoTasks.map(task => (
                  <tr key={task.id}>
                    <td className="px-4 fw-bold">
                      #{task.task_id ?? task.id}
                    </td>
                    <td>
                      <span className="badge bg-info-subtle text-info text-uppercase">
                        {task.seo_type?.replace('_', ' ') ?? 'N/A'}
                      </span>
                    </td>
                    <td>
                      {task.createdAt
                        ? new Date(task.createdAt).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="text-end px-4">
                      <span className="badge bg-success">Active</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* KEYWORDS */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-header bg-white border-0 py-3 px-4">
          <h6 className="fw-bold mb-0">Keyword Rankings</h6>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="px-4">Keyword</th>
                <th>Volume</th>
                <th>Difficulty</th>
                <th>Rank</th>
                <th>Target</th>
              </tr>
            </thead>
            <tbody>
              {keywords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-muted">
                    No keyword data available.
                  </td>
                </tr>
              ) : (
                keywords.map(kw => (
                  <tr key={kw.id}>
                    <td className="px-4 fw-bold">{kw.keyword}</td>
                    <td>{kw.search_volume ?? 0}</td>
                    <td>{kw.difficulty ?? 0}%</td>
                    <td>#{kw.current_rank ?? '-'}</td>
                    <td>#{kw.target_rank ?? '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default SEOPage;