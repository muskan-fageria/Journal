import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { authFetch } from '../utils/authFetch';
import { supabase } from '../utils/supabase';

export default function MemoryPage({ memories, setMemories, toast }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [activeLightboxIndex, setActiveLightboxIndex] = useState(null);

  // Form states for new memory
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageInputs, setImageInputs] = useState([{ file: null, url: '' }]);

  // Lock body scroll when a lightbox is open
  useEffect(() => {
    if (activeLightboxIndex !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeLightboxIndex]);

  // ==========================================
  // IMAGE HELPERS
  // ==========================================
  const parseImages = (imageUrlString) => {
    if (!imageUrlString) return [];
    if (imageUrlString.includes('|')) {
      return imageUrlString.split('|').map(u => u.trim()).filter(Boolean);
    }
    const rawParts = imageUrlString.split(',').map(u => u.trim()).filter(Boolean);
    const images = [];
    let current = "";
    
    for (const part of rawParts) {
      if (part.startsWith('data:') || part.startsWith('http') || part.startsWith('blob:')) {
        if (current) images.push(current);
        current = part;
      } else {
        current += (current ? ',' : '') + part;
      }
    }
    if (current) images.push(current);
    return images.filter(img => img.length > 10);
  };

  const handleFileChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const updated = [...imageInputs];
      updated[index] = { file, url };
      setImageInputs(updated);
    }
  };

  const handleUrlChange = (index, val) => {
    const updated = [...imageInputs];
    updated[index] = { file: null, url: val };
    setImageInputs(updated);
  };

  const addImageField = () => {
    setImageInputs([...imageInputs, { file: null, url: '' }]);
  };

  const removeImageField = (index) => {
    if (imageInputs.length === 1) {
      setImageInputs([{ file: null, url: '' }]);
    } else {
      setImageInputs(imageInputs.filter((_, i) => i !== index));
    }
  };

  // ==========================================
  // ADD & DELETE HANDLERS
  // ==========================================
  const handleCreateMemory = async () => {
    if (!title.trim() && !content.trim()) return toast('Please enter a title or narrative.');
    
    toast('Uploading memory...');
    
    const uploadedUrls = [];
    const filePaths = [];
    
    for (const input of imageInputs) {
      if (input.file) {
        const ext = input.file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        
        const { error } = await supabase.storage
          .from('memories')
          .upload(fileName, input.file);
          
        if (error) {
          console.error("Upload error:", error);
          toast("Failed to upload image.");
          return;
        }
        
        const { data: publicUrlData } = supabase.storage
          .from('memories')
          .getPublicUrl(fileName);
          
        uploadedUrls.push(publicUrlData.publicUrl);
        filePaths.push(fileName);
      } else if (input.url && input.url.trim().length > 0) {
        uploadedUrls.push(input.url.trim());
      }
    }

    const newMemory = {
      title,
      description: content,
      image_url: uploadedUrls.join('|'),
      file_path: filePaths.join('|'),
      created_at: new Date().toISOString()
    };

    try {
      const res = await authFetch('/api/memories', {
        method: 'POST',
        body: JSON.stringify(newMemory)
      });
      const data = await res.json();
      
      setMemories([data, ...memories]);
      
      // Reset form
      setTitle('');
      setContent('');
      setImageInputs([{ file: null, url: '' }]);
      setShowAddModal(false);
      toast('Memory captured ✓');
    } catch (err) {
      console.error(err);
      toast('Failed to save memory');
    }
  };

  const handleDeleteMemory = async (id) => {
    if (!window.confirm('Are you sure you want to let this memory fade?')) return;

    try {
      await fetch(`/api/memories/${id}`, { method: 'DELETE' });
      setMemories(memories.filter(m => m.id !== id));
      setSelectedMemory(null);
      toast('Memory faded');
    } catch (err) {
      console.error(err);
      toast('Failed to delete memory');
    }
  };

  const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };

  const formatDateDisplay = (dateStr) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June', 
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const date = new Date(dateStr);
    const day = date.getDate();
    return `${months[date.getMonth()]} ${day}${getOrdinalSuffix(day)}`;
  };

  const formatDateFull = (dateStr) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June', 
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const date = new Date(dateStr);
    const day = date.getDate();
    return `${months[date.getMonth()]} ${day}${getOrdinalSuffix(day)}, ${date.getFullYear()}`;
  };

  const selectedMemoryImages = selectedMemory ? parseImages(selectedMemory.image_url) : [];

  // Handle Lightbox Arrow Keys & Escape Key navigation
  useEffect(() => {
    if (activeLightboxIndex === null || selectedMemoryImages.length === 0) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        setActiveLightboxIndex((prev) => (prev === selectedMemoryImages.length - 1 ? 0 : prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setActiveLightboxIndex((prev) => (prev === 0 ? selectedMemoryImages.length - 1 : prev - 1));
      } else if (e.key === 'Escape') {
        setActiveLightboxIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeLightboxIndex, selectedMemoryImages]);

  // ==========================================
  // DYNAMIC BENTO CARD RENDERER
  // ==========================================
  const renderMemoryCard = (mem) => {
    const images = parseImages(mem.image_url);
    const hasImages = images.length > 0;

    // Card 1: Leaf Card Placeholder
    if (mem.id === "default_1") {
      return (
        <div 
          key={mem.id}
          onClick={() => setSelectedMemory(mem)}
          className="glass-panel rounded-xl overflow-hidden flex flex-col h-full group transition-all duration-500 col-span-1 md:col-span-2 lg:col-span-1 row-span-2 cursor-pointer"
        >
          <div className="relative h-64 md:h-80 w-full overflow-hidden">
            <img 
              src={images[0]} 
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-1000 ease-in-out opacity-80" 
              alt={mem.title} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
          </div>
          <div className="p-8 flex flex-col flex-grow relative z-10 -mt-20">
            <div className="flex items-center justify-between mb-4 select-none">
              <span className="font-label-caps text-label-caps text-secondary tracking-widest uppercase">
                {formatDateDisplay(mem.created_at)}
              </span>
              <span className="material-symbols-outlined text-outline text-sm" style={{ fontVariationSettings: "'FILL' 0" }}>
                {mem.icon || 'psychology'}
              </span>
            </div>
            <h3 className="font-h3 text-h3 text-on-surface mb-6 italic text-stone-300 leading-snug">
              {mem.title}
            </h3>
            {mem.category && (
              <div className="mt-auto flex gap-3 flex-wrap">
                <span className="px-3 py-1 rounded-full border border-outline-variant text-on-surface-variant font-label-caps text-[10px] uppercase flex items-center gap-1 bg-surface-container-low/50">
                  <span className="material-symbols-outlined text-[12px]">water_drop</span> {mem.category}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Card 2: Text-only Placeholder
    if (mem.id === "default_2") {
      return (
        <div 
          key={mem.id}
          onClick={() => setSelectedMemory(mem)}
          className="glass-panel rounded-xl overflow-hidden flex flex-col h-full group transition-all duration-500 col-span-1 cursor-pointer"
        >
          <div className="p-8 flex flex-col flex-1 justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-4 select-none">
                <span className="font-label-caps text-label-caps text-secondary tracking-widest uppercase">
                  {formatDateDisplay(mem.created_at)}
                </span>
              </div>
              <h3 className="font-h3 text-h3 text-on-surface mb-6 text-stone-200 leading-relaxed">
                {mem.content}
              </h3>
            </div>
            {mem.category && (
              <div className="mt-auto flex gap-3 flex-wrap select-none">
                <span className="px-3 py-1 rounded-full border border-outline-variant text-on-surface-variant font-label-caps text-[10px] uppercase flex items-center gap-1 bg-surface-container-low/50">
                  <span className="material-symbols-outlined text-[12px]">self_improvement</span> {mem.category}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Card 3: Beach Card Placeholder
    if (mem.id === "default_3") {
      return (
        <div 
          key={mem.id}
          onClick={() => setSelectedMemory(mem)}
          className="glass-panel rounded-xl overflow-hidden flex flex-col h-full group transition-all duration-500 col-span-1 cursor-pointer"
        >
          <div className="relative h-40 w-full overflow-hidden">
            <img 
              src={images[0]} 
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-1000 ease-in-out opacity-70 grayscale" 
              alt={mem.title} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
          </div>
          <div className="p-8 flex flex-col flex-grow relative z-10 -mt-10">
            <div className="flex items-center justify-between mb-4 select-none">
              <span className="font-label-caps text-label-caps text-secondary tracking-widest uppercase">
                {formatDateDisplay(mem.created_at)}
              </span>
            </div>
            <h3 className="font-h3 text-h3 text-on-surface mb-4 italic text-stone-400 leading-snug">
              {mem.title}
            </h3>
          </div>
        </div>
      );
    }

    // Card 4: Mist Forest Placeholder
    if (mem.id === "default_4") {
      return (
        <div 
          key={mem.id}
          onClick={() => setSelectedMemory(mem)}
          className="glass-panel rounded-xl overflow-hidden flex flex-col h-full group transition-all duration-500 col-span-1 md:col-span-2 cursor-pointer"
        >
          <div className="p-10 flex flex-col md:flex-row gap-8 items-center h-full justify-between">
            <div className="flex-grow">
              <div className="flex items-center justify-between mb-6 select-none">
                <span className="font-label-caps text-label-caps text-secondary tracking-widest uppercase">
                  {formatDateDisplay(mem.created_at)}
                </span>
                <span className="material-symbols-outlined text-outline text-sm" style={{ fontVariationSettings: "'FILL' 0" }}>
                  {mem.icon || 'spa'}
                </span>
              </div>
              <h2 className="font-h2 text-h2 text-on-surface mb-4 font-light leading-snug">
                {mem.content}
              </h2>
            </div>
            {hasImages && (
              <div className="w-full md:w-1/3 h-48 md:h-56 rounded-lg overflow-hidden relative flex-shrink-0">
                <img 
                  src={images[0]} 
                  className="object-cover w-full h-full opacity-60" 
                  alt={mem.title} 
                />
              </div>
            )}
          </div>
        </div>
      );
    }

    // Default bento-grid card layout for custom user-created cards
    return (
      <div 
        key={mem.id}
        onClick={() => setSelectedMemory(mem)}
        className="glass-panel rounded-xl overflow-hidden flex flex-col h-full group transition-all duration-500 bento-card cursor-pointer col-span-1"
      >
        {hasImages ? (
          <div className="relative h-44 w-full overflow-hidden flex-shrink-0">
            <img src={images[0]} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-1000 ease-in-out opacity-80" alt={mem.title} />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
          </div>
        ) : (
          <div className="h-10 w-full bg-gradient-to-t from-background to-transparent"></div>
        )}
        <div className="p-6 flex flex-col flex-grow relative z-10 justify-between">
          <div>
            <h3 className="font-h2 text-lg text-stone-100 leading-snug mb-2 group-hover:text-secondary transition-colors truncate">
              {mem.title || 'Moment captured'}
            </h3>
            <p className="text-xs text-on-surface-variant line-clamp-3 leading-relaxed">
              {mem.description || mem.content}
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] uppercase tracking-wider font-label-caps text-stone-500 select-none">
            <span>{formatDateDisplay(mem.created_at)}</span>
            <span className="group-hover:translate-x-1 transition-transform material-symbols-outlined text-sm text-secondary">
              arrow_right_alt
            </span>
          </div>
        </div>
      </div>
    );
  };

  const displayMemories = [...memories];

  if (selectedMemory) {
    const images = parseImages(selectedMemory.image_url);
    return (
      <div className="page max-w-7xl mx-auto w-full animate-fade-in relative pt-4 min-h-[80vh] flex flex-col">
        {/* Back and Delete buttons at the top */}
        <div className="flex justify-between items-center mb-8 select-none">
          <button 
            onClick={() => setSelectedMemory(null)}
            className="flex items-center gap-2 text-stone-400 hover:text-stone-100 transition-all duration-300 font-label-caps text-[10px] uppercase tracking-widest bg-white/5 border border-white/10 px-5 py-2.5 rounded-xl cursor-pointer hover:bg-white/10"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Gallery
          </button>
          
          <button 
            onClick={() => handleDeleteMemory(selectedMemory.id)}
            className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-2.5 rounded-xl hover:bg-red-500 hover:text-white transition-all duration-300 cursor-pointer font-label-caps text-[10px] uppercase tracking-widest"
            title="Delete Memory"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            Delete Memory
          </button>
        </div>

        {/* Individual Screen glassmorphic panel */}
        <div className="relative border border-white/10 rounded-3xl p-8 md:p-16 lg:p-24 flex flex-col flex-grow shadow-2xl overflow-hidden bg-stone-900/30 backdrop-blur-xl">
          {/* Ambient Glows */}
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-secondary/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 w-full flex flex-col flex-grow">
            {/* Title Section (Centered) */}
            <div className="text-center mb-10 select-none">
              <h1 className="font-h1 text-3xl md:text-5xl lg:text-6xl text-stone-100 font-light leading-tight tracking-wide mb-4 max-w-[85%] mx-auto">
                {selectedMemory.title || selectedMemory.category || 'Memory'}
              </h1>
              <div className="text-xs md:text-sm text-stone-500 font-label-caps tracking-widest uppercase">
                {formatDateFull(selectedMemory.created_at)}
              </div>
            </div>

            {/* Narrative/Description Section (Centered) */}
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <p className="text-stone-300 text-base md:text-lg leading-relaxed whitespace-pre-wrap">
                {selectedMemory.description || selectedMemory.content}
              </p>
            </div>

            {/* Image Gallery Section (Bottom) */}
            {images.length > 0 && (
              <div className="w-full mt-auto">
                <div className={`grid ${
                  images.length === 1 
                    ? 'grid-cols-1' 
                    : images.length === 2 
                    ? 'grid-cols-2 gap-6' 
                    : images.length === 3 
                    ? 'grid-cols-3 gap-6' 
                    : images.length === 4 
                    ? 'grid-cols-2 md:grid-cols-4 gap-6' 
                    : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
                }`}>
                  {images.map((img, i) => (
                    <div 
                      key={i} 
                      onClick={() => setActiveLightboxIndex(i)}
                      className={`relative rounded-2xl overflow-hidden cursor-pointer border border-white/5 bg-black hover:border-secondary/30 transition-all duration-500 group ${
                        images.length === 1 
                          ? 'aspect-[16/10] max-h-[550px]' 
                          : 'aspect-square'
                      }`}
                    >
                      <img 
                        src={img} 
                        className="object-cover w-full h-full group-hover:scale-[1.04] transition-transform duration-700 opacity-90 group-hover:opacity-100" 
                        alt="" 
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="material-symbols-outlined text-white/80 text-3xl">zoom_in</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lightbox Overlay (using Portal to escape stacking context) */}
        {activeLightboxIndex !== null && createPortal(
          <div 
            className="fixed inset-0 z-[9999] bg-stone-950/98 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in select-none"
            onClick={() => setActiveLightboxIndex(null)}
          >
            {/* Close Button */}
            <button 
              onClick={() => setActiveLightboxIndex(null)}
              className="absolute top-6 right-6 bg-white/5 border border-white/10 text-stone-300 p-3 rounded-full hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center z-50 shadow-lg"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            {/* Left navigation arrow */}
            {selectedMemoryImages.length > 1 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveLightboxIndex((prev) => (prev === 0 ? selectedMemoryImages.length - 1 : prev - 1));
                }}
                className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/5 border border-white/10 text-stone-300 p-4 rounded-full hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center z-50 hover:scale-105 active:scale-95 shadow-lg"
              >
                <span className="material-symbols-outlined text-2xl">chevron_left</span>
              </button>
            )}

            {/* Enlarged Image */}
            <div className="relative max-w-[85vw] max-h-[85vh] flex items-center justify-center">
              <img 
                src={selectedMemoryImages[activeLightboxIndex]} 
                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/10 transition-all duration-300" 
                alt="Enlarged view" 
                onClick={(e) => e.stopPropagation()} 
              />
              
              {/* Image Counter Indicator */}
              {selectedMemoryImages.length > 1 && (
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full text-xs text-stone-400 font-label-caps tracking-widest shadow-md">
                  {activeLightboxIndex + 1} / {selectedMemoryImages.length}
                </div>
              )}
            </div>

            {/* Right navigation arrow */}
            {selectedMemoryImages.length > 1 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveLightboxIndex((prev) => (prev === selectedMemoryImages.length - 1 ? 0 : prev + 1));
                }}
                className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/5 border border-white/10 text-stone-300 p-4 rounded-full hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center z-50 hover:scale-105 active:scale-95 shadow-lg"
              >
                <span className="material-symbols-outlined text-2xl">chevron_right</span>
              </button>
            )}
          </div>,
          document.body
        )}
      </div>
    );
  }

  if (showAddModal) {
    return (
      <div className="page max-w-7xl mx-auto w-full animate-fade-in relative pt-4 min-h-[80vh] flex flex-col">
        {/* Back navigation at the top */}
        <div className="flex justify-between items-center mb-8 select-none">
          <button 
            onClick={() => {
              setTitle('');
              setContent('');
              setImageInputs([{ file: null, url: '' }]);
              setShowAddModal(false);
            }}
            className="flex items-center gap-2 text-stone-400 hover:text-stone-100 transition-all duration-300 font-label-caps text-[10px] uppercase tracking-widest bg-white/5 border border-white/10 px-5 py-2.5 rounded-xl cursor-pointer hover:bg-white/10"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Gallery
          </button>
          
          <h2 className="font-label-caps text-xs text-stone-500 uppercase tracking-widest">New Memory Entry</h2>
        </div>

        {/* Capture Memory Screen glassmorphic panel */}
        <div className="relative border border-white/10 rounded-3xl p-8 md:p-16 lg:p-20 flex flex-col flex-grow shadow-2xl overflow-hidden bg-stone-900/30 backdrop-blur-xl">
          {/* Ambient Glows */}
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-secondary/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl mx-auto w-full flex flex-col flex-grow gap-8">
            {/* Header Section */}
            <div className="text-center select-none mb-4">
              <h1 className="font-h1 text-3xl md:text-5xl text-stone-100 font-light leading-tight tracking-wide mb-3">
                Capture Memory
              </h1>
              <p className="text-stone-500 text-sm max-w-md mx-auto font-newsreader italic">
                Record a quiet moment, a realization, or a milestone to anchor this day.
              </p>
            </div>

            {/* Form Fields */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider select-none">Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="A title to anchor this moment..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-stone-100 text-base focus:border-secondary focus:ring-0 placeholder-stone-600 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider select-none">Narrative</label>
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Record your thoughts, details, or what this moment represented..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-stone-100 text-base h-48 resize-none focus:border-secondary focus:ring-0 placeholder-stone-600 transition-colors custom-scrollbar"
                />
              </div>

              {/* Dynamic Multiple Image Fields */}
              <div className="flex flex-col gap-4">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider flex justify-between items-center select-none">
                  <span>Imagery (URLs or Uploads)</span>
                  <button 
                    onClick={addImageField}
                    className="text-xs text-secondary hover:text-white transition-colors cursor-pointer"
                  >
                    + Add Image
                  </button>
                </label>
                
                <div className="flex flex-col gap-4">
                  {imageInputs.map((inputObj, index) => {
                    const hasPreview = inputObj.url.trim().length > 0;
                    return (
                      <div key={index} className="bg-white/[0.02] border border-white/5 p-4 rounded-xl flex flex-col gap-3">
                        {!hasPreview ? (
                          <div className="flex flex-col md:flex-row items-center gap-4">
                            <label className="flex-grow w-full md:w-auto flex items-center justify-center gap-2 bg-white/5 border border-dashed border-white/20 rounded-xl p-4 cursor-pointer hover:bg-white/10 hover:border-secondary/50 transition-all group">
                              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-secondary">upload_file</span>
                              <span className="text-sm text-on-surface-variant group-hover:text-on-surface">Upload File</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => handleFileChange(index, e)}
                              />
                            </label>
                            <span className="text-stone-600 text-[10px] uppercase select-none hidden md:inline">or</span>
                            <input 
                              type="text" 
                              placeholder="Paste image URL here..."
                              value={inputObj.url}
                              onChange={(e) => handleUrlChange(index, e.target.value)}
                              className="flex-grow w-full md:w-auto bg-white/5 border border-white/10 rounded-xl p-4 text-stone-100 text-sm focus:border-secondary focus:ring-0 placeholder-stone-600 transition-colors"
                            />
                            <button 
                              onClick={() => removeImageField(index)}
                              className="text-stone-500 hover:text-red-400 transition-colors cursor-pointer self-end md:self-auto"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                        ) : (
                          <div className="relative w-full h-48 rounded-xl overflow-hidden border border-white/10">
                            <img className="w-full h-full object-cover" src={inputObj.url} alt="preview" />
                            <button 
                              onClick={() => removeImageField(index)}
                              className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full hover:bg-red-500 transition-colors cursor-pointer flex items-center justify-center"
                            >
                              <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="mt-8 pt-6 border-t border-white/5 flex justify-end gap-4 select-none">
              <button 
                onClick={() => {
                  setTitle('');
                  setContent('');
                  setImageInputs([{ file: null, url: '' }]);
                  setShowAddModal(false);
                }}
                className="bg-white/5 text-stone-300 px-6 py-3 rounded-xl text-xs font-label-caps uppercase tracking-wider hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateMemory}
                className="bg-secondary text-stone-900 px-8 py-3 rounded-xl text-xs font-label-caps uppercase tracking-wider hover:bg-white transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-lg"
              >
                Save Capture
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page max-w-7xl mx-auto w-full animate-fade-in relative pt-4">
      {/* Floating minimalistic capture memory button */}
      <button 
        onClick={() => setShowAddModal(true)}
        className="absolute top-4 right-4 bg-transparent border border-secondary/40 hover:border-secondary text-secondary hover:bg-secondary hover:text-stone-950 px-4 py-2 rounded-full font-label-caps text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center gap-2 cursor-pointer z-20"
      >
        <span className="material-symbols-outlined text-sm">add_a_photo</span> Capture Memory
      </button>

      {/* Centered clean header section */}
      <header className="pb-section-gap pt-2 max-w-5xl mx-auto w-full text-center select-none">
        <h1 className="font-h1 text-h1 text-on-surface mb-6 font-light">Memory Gallery</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
          A gentle walkthrough of your shared moments and quiet realizations.
        </p>
      </header>

      {/* Memories Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {displayMemories.length > 0 ? (
          displayMemories.map((mem) => renderMemoryCard(mem))
        ) : (
          <div className="col-span-full py-24 text-center text-stone-500 italic select-none">
            No memories captured yet. Capture a thought or visual snippet above.
          </div>
        )}
      </div>

      {/* Load Earlier button */}
      <div className="mt-16 flex justify-center select-none">
        <button 
          className="font-label-caps text-label-caps text-secondary uppercase tracking-widest border-b border-secondary pb-1 hover:text-stone-300 hover:border-stone-300 transition-colors duration-300 cursor-pointer"
          onClick={() => toast("Earlier memories loaded.")}
        >
          Load Earlier Memories
        </button>
      </div>

      {/* Removed add memory modal block - now early returns as an individual page */}
    </div>
  );
}
