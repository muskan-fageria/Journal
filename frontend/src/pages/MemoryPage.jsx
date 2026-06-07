import React, { useState } from 'react';

// Hardcoded default bento cards to match the reference design and screen mockup
const defaultMemories = [
  {
    id: "default_1",
    title: `"The stillness of the morning reveals what the noise of the day obscures."`,
    content: "A beautiful silent walk through the wet pine woods today.",
    category: "Clarity",
    icon: "psychology",
    image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAKkJbRuw5NucnVH8yw0fBE6S-WljtrBt_ZygfieCYQsZ6Tq-auy4ko3R-RjWn3XRFO2tGsTRVtkovmoYaWjhtRQvNOyMl-oh_vIot3mAiRLiPau527mxiwSNNdG8ZfgCNgmFY9NDAH6F3giIlhMSlxwIVGFL1ZH52qh8XE8-OaVu2P_7XXhvwbLr6jixwEA8pGYtz91Mzg2cTh-D3KziTFF2zYAjhH4D-PplK0jerLcu3QNJtAkZbDm48tOt_e-18KVZT1USk9c34",
    created_at: "2026-10-14T08:00:00.000Z"
  },
  {
    id: "default_2",
    title: "",
    content: "A brief moment of profound gratitude while watching the rain.",
    category: "Stillness",
    icon: "self_improvement",
    image_url: "",
    created_at: "2026-10-10T08:00:00.000Z"
  },
  {
    id: "default_3",
    title: `"Breathing out the weight."`,
    content: "A wide open shore line, letting the thoughts drift out with the tide.",
    category: "Introspection",
    icon: "spa",
    image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuB-DcJUEDAbP02288KGewPJvsPDBeLYTzlcaebyYt-w6o-RPj6rCOlKs0OrHkj1byv3xMe5ZOU80UL_hTVfLYaiCLNnr_fqBZ5skOITtAhYItRpssde64oksiwiKLOMMv5CKdWetWoTuJuSSrzBDmWKJncvoW2eN8GXAi3URXaDsfgpLYVepNE2so--D6f4brn-ICU_18JTxSaVVDLbxWR8AXzv7-dNBrIzIcee5O9dEynDYApGKUaX1WJVJwQm6r2RO6UIf8CFSmM",
    created_at: "2026-10-02T08:00:00.000Z"
  },
  {
    id: "default_4",
    title: "Space Between Thoughts",
    content: "Found space between the thoughts. The tension in my shoulders finally dissolved after a long walk through the mist.",
    category: "Stillness",
    icon: "spa",
    image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuB72VJsYqcriR8yXkl-EXFMyyyDwL9wkOKIk9Rczs-IQ7rkK5tTFb0g9GYqHZff0PeUXrtfL2lPW43WGbZfO_EXVrbAVpnUU5HIG1b7yIVKnTpSm59Q1eL6KaDrEHqpfC2N0u-T0Z8PCP3ZAMf-G2vBYrmEx0ft-5WgT5qkckQ0xT6sJDksZsZfXUfCHSrDeYeqt2EkamDmQzqGLFkMiAr5G4hc_H_S28y_hgzC05QxmwoP6zSWkm1Dx9NV76DfF5i4x9So7e_cmGo",
    created_at: "2026-09-28T08:00:00.000Z"
  }
];

export default function MemoryPage({ memories, setMemories, toast }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState(null);

  // Form states for new memory
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageInputs, setImageInputs] = useState(['']);

  // Handle local state tracking of deleted placeholders
  const [deletedPlaceholders, setDeletedPlaceholders] = useState(() => {
    try {
      const saved = localStorage.getItem('deleted_placeholders');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const saveDeletedPlaceholders = (updated) => {
    setDeletedPlaceholders(updated);
    try {
      localStorage.setItem('deleted_placeholders', JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save deleted placeholders:", e);
    }
  };

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
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const updated = [...imageInputs];
        updated[index] = uploadEvent.target.result;
        setImageInputs(updated);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (index, val) => {
    const updated = [...imageInputs];
    updated[index] = val;
    setImageInputs(updated);
  };

  const addImageField = () => {
    setImageInputs([...imageInputs, '']);
  };

  const removeImageField = (index) => {
    if (imageInputs.length === 1) {
      setImageInputs(['']);
    } else {
      setImageInputs(imageInputs.filter((_, i) => i !== index));
    }
  };

  // ==========================================
  // ADD & DELETE HANDLERS
  // ==========================================
  const handleCreateMemory = async () => {
    if (!title.trim() && !content.trim()) return toast('Please enter a title or narrative.');
    
    const validImages = imageInputs.filter(img => img.trim().length > 0);
    const imageUrlString = validImages.join('|');

    const newMemory = {
      title,
      content,
      image_url: imageUrlString,
      created_at: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMemory)
      });
      const data = await res.json();
      setMemories([data, ...memories]);
      
      // Reset form
      setTitle('');
      setContent('');
      setImageInputs(['']);
      setShowAddModal(false);
      toast('Memory captured ✓');
    } catch (err) {
      console.error(err);
      toast('Failed to save memory');
    }
  };

  const handleDeleteMemory = async (id) => {
    if (!window.confirm('Are you sure you want to let this memory fade?')) return;
    
    if (id.toString().startsWith('default_')) {
      const updated = [...deletedPlaceholders, id];
      saveDeletedPlaceholders(updated);
      setSelectedMemory(null);
      toast('Memory faded');
      return;
    }

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
          <div className="p-8 flex flex-col flex-1 relative z-10 -mt-20">
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
          <div className="p-8 flex flex-col flex-1 relative z-10 -mt-10">
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
              {mem.content}
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

  // Filters out duplicate mock entries from backend and maps layout lists
  const customMemories = memories.filter(
    m => !m.id.startsWith('mem_') && !m.id.startsWith('default_')
  );
  const activePlaceholders = defaultMemories.filter(
    m => !deletedPlaceholders.includes(m.id)
  );
  const displayMemories = [...activePlaceholders, ...customMemories];

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
      <header className="py-section-gap max-w-5xl mx-auto w-full text-center select-none">
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

      {/* ==========================================
          ADD MEMORY MODAL (MODAL)
          ========================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-[1000] bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar flex flex-col shadow-2xl animate-fade-in">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center select-none">
              <h2 className="font-h2 text-xl text-stone-100">Capture Memory</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-stone-500 hover:text-stone-300 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {/* Form Content */}
            <div className="p-6 flex flex-col gap-6 overflow-y-auto">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider select-none">Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="A title to anchor this moment..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-on-surface text-sm focus:border-secondary focus:ring-0"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider select-none">Narrative</label>
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Record your thoughts, details, or what this moment represented..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-on-surface text-sm h-32 resize-none focus:border-secondary focus:ring-0"
                />
              </div>

              {/* Dynamic Multiple Image Fields */}
              <div className="flex flex-col gap-3">
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
                  {imageInputs.map((val, index) => {
                    const hasPreview = val.trim().length > 0;
                    return (
                      <div key={index} className="bg-white/[0.02] border border-white/5 p-4 rounded-xl flex flex-col gap-3">
                        {!hasPreview ? (
                          <div className="flex flex-col md:flex-row items-center gap-4">
                            <label className="flex-grow flex items-center justify-center gap-2 bg-white/5 border border-dashed border-white/20 rounded-xl p-3 cursor-pointer hover:bg-white/10 hover:border-secondary/50 transition-all group">
                              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-secondary">upload_file</span>
                              <span className="text-xs text-on-surface-variant group-hover:text-on-surface">Upload File</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => handleFileChange(index, e)}
                              />
                            </label>
                            <span className="text-stone-600 text-[10px] uppercase select-none">or</span>
                            <input 
                              type="text" 
                              placeholder="Paste image URL here..."
                              value={val}
                              onChange={(e) => handleUrlChange(index, e.target.value)}
                              className="flex-grow bg-white/5 border border-white/10 rounded-xl p-3 text-on-surface text-xs focus:border-secondary focus:ring-0"
                            />
                            <button 
                              onClick={() => removeImageField(index)}
                              className="text-stone-500 hover:text-red-400 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                        ) : (
                          <div className="relative w-full h-36 rounded-xl overflow-hidden border border-white/10">
                            <img className="w-full h-full object-cover" src={val} alt="preview" />
                            <button 
                              onClick={() => removeImageField(index)}
                              className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-red-500 transition-colors cursor-pointer flex items-center justify-center"
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

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-3 select-none">
              <button 
                onClick={() => setShowAddModal(false)}
                className="bg-white/5 text-stone-300 px-5 py-2.5 rounded-xl text-xs font-label-caps uppercase tracking-wider hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateMemory}
                className="bg-secondary text-stone-900 px-5 py-2.5 rounded-xl text-xs font-label-caps uppercase tracking-wider hover:bg-white transition-colors cursor-pointer"
              >
                Save Capture
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MEMORY DETAIL MODAL
          ========================================== */}
      {selectedMemory && (() => {
        const images = parseImages(selectedMemory.image_url);
        return (
          <div className="fixed inset-0 z-[1000] bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-stone-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col shadow-2xl animate-fade-in">
              {/* Image Slideshow / Carousel */}
              {images.length > 0 && (
                <div className="relative bg-black h-72 md:h-96 w-full flex-shrink-0 flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-none">
                    {images.map((img, i) => (
                      <div key={i} className="w-full h-full snap-start snap-always flex-shrink-0">
                        <img src={img} className="object-contain w-full h-full" alt="" />
                      </div>
                    ))}
                  </div>
                  {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-stone-400 font-label-caps select-none">
                      Swipe left / right to browse ({images.length} images)
                    </div>
                  )}
                </div>
              )}

              {/* Text narrative */}
              <div className="p-8 flex flex-col flex-grow gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-h2 text-2xl text-stone-100 mb-1">{selectedMemory.title || selectedMemory.category || 'Memory'}</h2>
                    <div className="text-xs text-stone-500 font-label-caps select-none">
                      {formatDateFull(selectedMemory.created_at)}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleDeleteMemory(selectedMemory.id)}
                      className="bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 rounded-xl hover:bg-red-500 hover:text-white transition-all cursor-pointer flex items-center justify-center"
                      title="Delete Memory"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                    <button 
                      onClick={() => setSelectedMemory(null)}
                      className="bg-white/5 border border-white/10 text-stone-300 p-2.5 rounded-xl hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  </div>
                </div>

                <p className="text-on-surface-variant text-sm leading-relaxed whitespace-pre-wrap mt-2">
                  {selectedMemory.content}
                </p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
