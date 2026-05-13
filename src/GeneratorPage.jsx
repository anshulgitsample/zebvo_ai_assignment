import { CONTENT_TYPES, TONES, generateContent, generateImagePrompt } from './aiService';
import { useContentStore, useToastStore, useWorkspaceStore } from './store';

import { useState } from 'react';

export default function GeneratorPage({ initialType }) {
  const ws = useWorkspaceStore(s => s.getActive());
  const addItem = useContentStore(s => s.addItem);
  const toast = useToastStore(s => s.show);

  const [type, setType] = useState(initialType || 'instagram');
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [tone, setTone] = useState(ws?.tone || 'professional');
  const [generating, setGenerating] = useState(false);
  const [streaming, setStreaming] = useState('');
  const [result, setResult] = useState('');
  const [saved, setSaved] = useState(false);
  const [imgPrompt, setImgPrompt] = useState('');
  const [genningImg, setGenningImg] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  if (!ws) return (
    <div className="page">
      <div className="empty-state">
        <h3>No workspace selected</h3>
        <p>Create a workspace first to start generating content.</p>
      </div>
    </div>
  );

  const handleGenerate = async () => {
    if (!topic.trim()) { toast('Please enter a topic', 'error'); return; }
    setGenerating(true); setStreaming(''); setResult(''); setSaved(false); setImgPrompt(''); setEditMode(false);
    try {
      const final = await generateContent({
        type, brand: ws.name, industry: ws.industry, tone, topic, audience,
        onChunk: (text) => setStreaming(text),
      });
      setResult(final); setStreaming('');
      toast('Content generated!', 'success');
    } catch (err) {
      toast(err.message || 'Generation failed', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    const content = editMode ? editedContent : result;
    addItem({
      workspaceId: ws.id, workspaceName: ws.name,
      contentType: type, platform: CONTENT_TYPES.find(t2 => t2.id === type)?.platform,
      topic, tone, audience, content, imagePrompt: imgPrompt,
    });
    setSaved(true);
    toast('Saved to content library!', 'success');
  };

  const handleRegenerate = () => {
    setResult(''); setSaved(false); setEditMode(false); handleGenerate();
  };

  const handleGetImagePrompt = async () => {
    setGenningImg(true);
    try {
      const p = await generateImagePrompt({ brand: ws.name, industry: ws.industry, topic });
      setImgPrompt(p);
    } catch { toast('Failed to generate image prompt', 'error'); }
    finally { setGenningImg(false); }
  };

  const displayContent = streaming || result;
  const typeInfo = CONTENT_TYPES.find(t2 => t2.id === type);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Content Generator</h1>
        <p className="page-subtitle">AI-powered content for {ws.name}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, alignItems: 'start' }}>
        {/* LEFT: Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Workspace info */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <div className="flex items-center gap-2">
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: ws.color || 'var(--accent)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{ws.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{ws.industry}</div>
              </div>
            </div>
          </div>

          {/* Content type */}
          <div className="card">
            <div className="label" style={{ marginBottom: 10 }}>Content Type</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {CONTENT_TYPES.map(t2 => (
                <button key={t2.id}
                  onClick={() => { setType(t2.id); setResult(''); setSaved(false); }}
                  style={{
                    padding: '10px 8px', borderRadius: 8, cursor: 'pointer',
                    border: `1px solid ${type === t2.id ? 'var(--accent)' : 'var(--border)'}`,
                    background: type === t2.id ? 'rgba(79,124,255,0.1)' : 'var(--bg2)',
                    color: type === t2.id ? 'var(--accent)' : 'var(--text2)',
                    fontSize: 12, fontWeight: 500, textAlign: 'center',
                    transition: 'var(--transition)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  }}>
                  <span style={{ fontSize: 18 }}>{t2.icon}</span>
                  <span>{t2.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="card">
            <div className="field">
              <label className="label">Topic / What to create about *</label>
              <textarea className="textarea" placeholder="e.g. New product launch, summer sale, company milestone, tips for customers..." value={topic} onChange={e => setTopic(e.target.value)} style={{ minHeight: 80 }} />
            </div>
            <div className="field">
              <label className="label">Target Audience</label>
              <input className="input" placeholder="e.g. entrepreneurs, busy parents, fitness enthusiasts..." value={audience} onChange={e => setAudience(e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Tone & Style</label>
              <select className="select" value={tone} onChange={e => setTone(e.target.value)}>
                {TONES.map(t2 => <option key={t2.id} value={t2.id}>{t2.label}</option>)}
              </select>
            </div>
          </div>

          <button className="btn btn-primary btn-lg w-full" style={{ justifyContent: 'center' }} onClick={handleGenerate} disabled={generating || !topic.trim()}>
            {generating ? <><span className="spinner" /> Generating...</> : <>✦ Generate {typeInfo?.label}</>}
          </button>
        </div>

        {/* RIGHT: Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!displayContent && !generating && (
            <div className="card" style={{ minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>{typeInfo?.icon}</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 8 }}>Ready to create</h3>
              <p style={{ color: 'var(--text2)', maxWidth: 300 }}>Fill in your details on the left and click Generate to create AI-powered content</p>
              <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                {['New product launch', 'Customer success story', 'Industry insight', 'Company milestone'].map(t2 => (
                  <button key={t2} className="btn btn-ghost btn-sm" onClick={() => setTopic(t2)}>{t2}</button>
                ))}
              </div>
            </div>
          )}

          {(displayContent || generating) && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 18 }}>{typeInfo?.icon}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>{typeInfo?.label}</span>
                  {streaming && <span className="badge badge-blue">Generating...</span>}
                  {result && !streaming && <span className="badge badge-green">Complete</span>}
                </div>
                {result && (
                  <div className="flex gap-2">
                    <button className="btn btn-ghost btn-sm" onClick={() => { setEditMode(!editMode); setEditedContent(result); }}>
                      {editMode ? 'View' : '✏️ Edit'}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={handleRegenerate}>↻ Redo</button>
                  </div>
                )}
              </div>

              {generating && !displayContent && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '40px 0', color: 'var(--text3)' }}>
                  <span className="spinner" />
                  <span>Crafting your content with AI...</span>
                </div>
              )}

              {editMode ? (
                <textarea className="textarea" value={editedContent} onChange={e => setEditedContent(e.target.value)} style={{ minHeight: 320, fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.7 }} />
              ) : (
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: 14, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
                  {displayContent}
                  {streaming && <span className="cursor" />}
                </div>
              )}

              {result && (
                <div className="flex gap-2 mt-4" style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                  <button className="btn btn-success" onClick={handleSave} disabled={saved}>
                    {saved ? '✓ Saved' : '💾 Save'}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard.writeText(editMode ? editedContent : result); toast('Copied!', 'success'); }}>
                    📋 Copy
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={handleRegenerate}>↻ Regenerate</button>
                </div>
              )}
            </div>
          )}

          {/* Image Prompt Generator */}
          {result && (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>🎨 Image Generation</h4>
                <button className="btn btn-ghost btn-sm" onClick={handleGetImagePrompt} disabled={genningImg}>
                  {genningImg ? <><span className="spinner" /> Generating...</> : '✦ Generate Image Prompt'}
                </button>
              </div>
              {imgPrompt ? (
                <>
                  <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 12 }}>
                    <strong style={{ color: 'var(--text)', display: 'block', marginBottom: 4 }}>AI Image Prompt:</strong>
                    {imgPrompt}
                  </div>
                  <div className="img-placeholder">
                    <span style={{ fontSize: 28 }}>🖼️</span>
                    <span>Use this prompt with Gemini Imagen, Midjourney, or DALL-E</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard.writeText(imgPrompt); toast('Prompt copied!', 'success'); }}>
                      📋 Copy Prompt
                    </button>
                  </div>
                </>
              ) : (
                <p style={{ color: 'var(--text3)', fontSize: 13 }}>Generate an AI prompt for creating a matching visual for this content</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
