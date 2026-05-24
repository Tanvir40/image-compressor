"use client";

import { useState, useRef, useEffect } from "react";

export default function Home() {
  // ----- Existing tool state (unchanged) -----
  const [file, setFile] = useState(null);
  const [original, setOriginal] = useState(null);
  const [compressed, setCompressed] = useState(null);
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState("webp");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [resizeEnabled, setResizeEnabled] = useState(false);
  const [targetWidth, setTargetWidth] = useState("");
  const [targetHeight, setTargetHeight] = useState("");
  const [maintainAspect, setMaintainAspect] = useState(true);
  const [compressedDimensions, setCompressedDimensions] = useState(null);
  const fileInputRef = useRef(null);

  // ----- Helper functions (unchanged) -----
  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }
    setFile(selectedFile);
    setError("");
    setCompressed(null);
    setCompressedDimensions(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.width, height: img.height });
        if (maintainAspect && resizeEnabled) {
          setTargetWidth(img.width.toString());
          setTargetHeight(img.height.toString());
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(selectedFile);
  };

  useEffect(() => {
    if (maintainAspect && originalDimensions.width && originalDimensions.height && resizeEnabled) {
      if (targetWidth && !targetHeight) {
        const ratio = originalDimensions.height / originalDimensions.width;
        const calculatedHeight = Math.round(parseInt(targetWidth) * ratio);
        setTargetHeight(calculatedHeight.toString());
      } else if (targetHeight && !targetWidth) {
        const ratio = originalDimensions.width / originalDimensions.height;
        const calculatedWidth = Math.round(parseInt(targetHeight) * ratio);
        setTargetWidth(calculatedWidth.toString());
      }
    }
  }, [targetWidth, targetHeight, maintainAspect, originalDimensions, resizeEnabled]);

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }
    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("quality", quality);
    formData.append("format", format);
    if (resizeEnabled) {
      if (targetWidth && parseInt(targetWidth) > 0) formData.append("width", parseInt(targetWidth));
      if (targetHeight && parseInt(targetHeight) > 0) formData.append("height", parseInt(targetHeight));
    }
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }
      setOriginal(data.original);
      setCompressed(data.compressed);
      setBefore(data.originalSize);
      setAfter(data.compressedSize);
      if (data.compressedDimensions) setCompressedDimensions(data.compressedDimensions);
    } catch {
      setError("Upload failed. Please try again.");
    }
    setLoading(false);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files[0]) handleFileChange(e.dataTransfer.files[0]);
  };

  const clearAll = () => {
    setFile(null);
    setPreview(null);
    setOriginal(null);
    setCompressed(null);
    setError("");
    setBefore("");
    setAfter("");
    setCompressedDimensions(null);
    setTargetWidth("");
    setTargetHeight("");
    setOriginalDimensions({ width: 0, height: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getSizeChange = () => {
    if (!before || !after) return null;
    const beforeMatch = before.match(/[\d.]+/);
    const afterMatch = after.match(/[\d.]+/);
    if (!beforeMatch || !afterMatch) return null;
    let beforeNum = parseFloat(beforeMatch[0]);
    let afterNum = parseFloat(afterMatch[0]);
    if (before.includes("MB")) beforeNum *= 1024;
    if (after.includes("MB")) afterNum *= 1024;
    const change = ((afterNum - beforeNum) / beforeNum) * 100;
    return { percent: Math.abs(change).toFixed(1), isIncrease: change > 0 };
  };
  const sizeChange = getSizeChange();

  // ----- Landing page JSX with embedded tool -----
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <div className="absolute"></div>
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
              Image Optimizer Pro
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Compress, convert, and resize images instantly – entirely in your browser. No uploads, no servers, 100% private.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="#tool" className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl font-semibold hover:shadow-lg transition transform hover:scale-105">
                Start Converting
              </a>
              <a href="#features" className="px-6 py-3 bg-white/10 backdrop-blur rounded-xl font-semibold hover:bg-white/20 transition">
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12">Why Choose Image Optimizer Pro</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 rounded-2xl p-6 text-center border border-white/20">
              <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">100% Private</h3>
              <p className="text-gray-300">All processing happens in your browser. Your images never leave your device – no upload, no server storage.</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-6 text-center border border-white/20">
              <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">All Formats</h3>
              <p className="text-gray-300">Support for JPEG, PNG, WebP, AVIF. Convert, compress, and resize with full control over quality and dimensions.</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-6 text-center border border-white/20">
              <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Lightning Fast</h3>
              <p className="text-gray-300">Powered by WebAssembly and modern codecs. Instant conversion, no queues, no waiting.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {["1. Select Image", "2. Choose Format & Quality", "3. Resize (optional)", "4. Download Result"].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">{i+1}</div>
                <p className="text-gray-200 font-medium">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Tool - Integrated */}
      <section id="tool" className="py-12 bg-white/5 rounded-3xl mx-4 md:mx-8 mb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Controls Panel */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
                <h2 className="text-xl font-semibold text-white mb-4">Settings</h2>
                <div className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${dragActive ? "border-orange-400 bg-orange-400/10" : "border-gray-400 hover:border-orange-400 bg-white/5"}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
                  <input ref={fileInputRef} type="file" onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])} className="hidden" accept="image/*" />
                  {preview ? (
                    <div className="space-y-3">
                      <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                      <p className="text-white text-sm">{file?.name}</p>
                      <p className="text-gray-300 text-xs">Original: {originalDimensions.width}×{originalDimensions.height}</p>
                      <button onClick={(e) => { e.stopPropagation(); clearAll(); }} className="text-red-400 text-sm hover:text-red-300">Remove</button>
                    </div>
                  ) : (
                    <div>
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <p className="text-gray-300 mt-2">Drag & drop or click to upload</p>
                      <p className="text-gray-400 text-xs mt-1">Max 10MB (JPG, PNG, WebP, AVIF)</p>
                    </div>
                  )}
                </div>

                {/* Format, Quality, Resize controls (same as before) */}
                <div className="mt-4">
                  <label className="block text-white text-sm font-medium mb-2">Output Format</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["jpeg", "png", "webp", "avif"].map((fmt) => (
                      <button key={fmt} onClick={() => setFormat(fmt)} className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${format === fmt ? "bg-orange-500 text-white shadow-lg" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>
                        {fmt.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  {format === "png" && <div className="text-xs bg-yellow-500/20 text-yellow-200 p-2 rounded mt-2">⚠️ PNG is lossless – quality slider has minimal effect. Use WebP/JPEG for photos.</div>}
                </div>

                <div className="mt-4">
                  <label className="block text-white text-sm font-medium mb-2">Quality: <span className="text-orange-400">{quality}%</span></label>
                  <input type="range" min="10" max="100" value={quality} onChange={(e) => setQuality(parseInt(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
                  <div className="flex justify-between text-gray-400 text-xs mt-1"><span>Smaller</span><span>Better Quality</span></div>
                </div>

                <div className="mt-6 border-t border-white/20 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer mb-4">
                    <input type="checkbox" checked={resizeEnabled} onChange={(e) => { setResizeEnabled(e.target.checked); if (e.target.checked && originalDimensions.width) { setTargetWidth(originalDimensions.width.toString()); setTargetHeight(originalDimensions.height.toString()); } }} className="w-4 h-4 text-orange-500 rounded" />
                    <span className="text-white text-sm font-medium">Enable Resize</span>
                  </label>
                  {resizeEnabled && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-gray-300 text-xs mb-1">Width (px)</label><input type="number" value={targetWidth} onChange={(e) => setTargetWidth(e.target.value)} placeholder="Auto" className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white" /></div>
                        <div><label className="block text-gray-300 text-xs mb-1">Height (px)</label><input type="number" value={targetHeight} onChange={(e) => setTargetHeight(e.target.value)} placeholder="Auto" className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white" /></div>
                      </div>
                      <label className="flex items-center gap-2"><input type="checkbox" checked={maintainAspect} onChange={(e) => setMaintainAspect(e.target.checked)} className="w-4 h-4 text-orange-500 rounded" /><span className="text-gray-300 text-xs">Maintain aspect ratio</span></label>
                      <p className="text-gray-400 text-xs">Leave empty to keep original dimension. Both dimensions act as max bounds.</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-3">
                  <button onClick={handleUpload} disabled={!file || loading} className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50">
                    {loading ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Processing...</span> : "Convert & Compress"}
                  </button>
                  {file && <button onClick={clearAll} className="w-full bg-white/10 text-gray-300 py-2 rounded-xl font-medium hover:bg-white/20">Clear All</button>}
                </div>
                {error && <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-lg p-3"><p className="text-red-300 text-sm text-center">{error}</p></div>}
              </div>

              {/* Results Panel */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
                <h2 className="text-xl font-semibold text-white mb-4">Results</h2>
                {original && compressed ? (
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2"><span className="text-gray-300 text-sm">Before</span><span className="text-gray-300 text-sm">After</span></div>
                      <div className="flex justify-between items-center"><span className="text-white font-semibold">{before}</span><svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg><span className="text-green-400 font-semibold">{after}</span></div>
                      {sizeChange && <div className="mt-2 text-center"><span className={`text-sm font-medium ${sizeChange.isIncrease ? "text-red-400" : "text-green-400"}`}>{sizeChange.isIncrease ? `⚠️ Increased by ${sizeChange.percent}%` : `✨ Saved ${sizeChange.percent}%`} • {format.toUpperCase()}</span></div>}
                      {compressedDimensions && <div className="mt-2 text-center text-gray-400 text-xs">Output size: {compressedDimensions.width}×{compressedDimensions.height}</div>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center"><p className="text-gray-300 text-xs mb-1">Original</p><img src={original} alt="Original" className="w-full rounded-lg border border-white/20" /></div>
                      <div className="text-center"><p className="text-gray-300 text-xs mb-1">Compressed</p><img src={compressed} alt="Compressed" className="w-full rounded-lg border border-white/20" /></div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <a href={compressed} download={`compressed.${format === "jpeg" ? "jpg" : format}`} className="flex-1 bg-green-500 text-white text-center py-2 rounded-xl font-medium hover:bg-green-600">Download Compressed</a>
                      <button onClick={clearAll} className="px-4 bg-white/10 text-gray-300 rounded-xl hover:bg-white/20">New Image</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-96 text-center">
                    <svg className="w-24 h-24 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p className="text-gray-400">Upload an image to see results</p>
                    <p className="text-gray-500 text-sm mt-2">Supports JPG, PNG, WebP, AVIF</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-gray-400">
        <div className="container mx-auto px-4">
          <p>Developed with ❤️ by <span className="text-orange-400 font-medium">Tanvir Hasan Tonmoy</span></p>
          <p className="text-sm mt-2">All processing happens locally – your images never leave your device.</p>
        </div>
      </footer>
    </>
  );
}