import React, { useRef } from 'react';
import {
  Activity,
  RotateCcw,
  Play,
  Pause,
  Sun,
  Moon,
  Download,
  Upload,
  FileSpreadsheet,
  Layers,
  Thermometer,
  Eye,
  Camera,
} from 'lucide-react';
import { useSimulationStore } from '../store/simulationStore';
import { SimulationMode } from '../types/thermo';

export const Header: React.FC = () => {
  const {
    mode,
    setMode,
    isPlaying,
    togglePlay,
    resetToDefaults,
    tempUnit,
    setTempUnit,
    isDarkMode,
    toggleDarkMode,
    view2D,
    toggleView2D,
    exportConfigJson,
    importConfigJson,
    exportStateTableCsv,
    exportExperimentCsv,
  } = useSimulationStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadConfig = () => {
    const jsonStr = exportConfigJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brayton-config-${mode.toLowerCase()}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const ok = importConfigJson(text);
          if (ok) {
            alert('Đã nạp thành công cấu hình mô phỏng!');
          } else {
            alert('Lỗi định dạng tệp JSON cấu hình!');
          }
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleDownloadStateCsv = () => {
    const csv = exportStateTableCsv();
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brayton-state-table-${mode.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadExpCsv = () => {
    const csv = exportExperimentCsv();
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brayton-sweep-data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCaptureScreen = () => {
    window.print();
  };

  return (
    <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-50 px-4 py-3 shadow-md">
      <div className="max-w-[1720px] mx-auto flex flex-col xl:flex-row items-center justify-between gap-3">
        {/* Title and Branding */}
        <div className="flex items-center gap-3 w-full xl:w-auto justify-between xl:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-amber-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Activity className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Brayton Cycle Simulator
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 rounded">
                  Lab v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Mô phỏng chu trình nhiệt động lực học động cơ tuabin khí & động cơ phản lực (Gas Turbine & Jet Engine)
              </p>
            </div>
          </div>

          {/* Quick mobile controls */}
          <div className="flex items-center gap-1.5 xl:hidden">
            <button
              onClick={togglePlay}
              className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1 transition ${
                isPlaying
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
              }`}
              title={isPlaying ? 'Tạm dừng mô phỏng' : 'Tiếp tục mô phỏng'}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Center: Simulation Mode Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner w-full xl:w-auto overflow-x-auto justify-center">
          <button
            onClick={() => setMode('IDEAL')}
            className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition whitespace-nowrap flex items-center gap-1.5 ${
              mode === 'IDEAL'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-cyan-300"></span>
            A. Chu trình Lý tưởng
            <span className="text-[11px] opacity-75 hidden md:inline">(Ideal Brayton)</span>
          </button>

          <button
            onClick={() => setMode('REAL')}
            className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition whitespace-nowrap flex items-center gap-1.5 ${
              mode === 'REAL'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-sky-300"></span>
            B. Chu trình Thực tế
            <span className="text-[11px] opacity-75 hidden md:inline">(Real Cycle)</span>
          </button>

          <button
            onClick={() => setMode('TURBOJET')}
            className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition whitespace-nowrap flex items-center gap-1.5 ${
              mode === 'TURBOJET'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-300"></span>
            C. Động cơ Phản lực
            <span className="text-[11px] opacity-75 hidden md:inline">(Turbojet)</span>
          </button>
        </div>

        {/* Right: Controls & Tools */}
        <div className="flex items-center flex-wrap gap-2 justify-end w-full xl:w-auto">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className={`hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              isPlaying
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20'
                : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {isPlaying ? 'Tạm dừng' : 'Chạy'}
          </button>

          {/* Reset */}
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition"
            title="Đặt lại thông số mặc định (Reset to default parameters)"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Đặt lại</span>
          </button>

          {/* 2D / 3D Toggle */}
          <button
            onClick={toggleView2D}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
              view2D
                ? 'bg-purple-900/30 border-purple-500/50 text-purple-300'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Chuyển đổi giữa mô hình 3D và sơ đồ 2D (Toggle 3D / 2D Engine View)"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>{view2D ? 'Sơ đồ 2D' : 'Mô hình 3D'}</span>
          </button>

          {/* Temp Unit Toggle */}
          <button
            onClick={() => setTempUnit(tempUnit === 'K' ? 'C' : 'K')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition"
            title="Đổi đơn vị nhiệt độ hiển thị (Kelvin / Celsius)"
          >
            <Thermometer className="h-3.5 w-3.5 text-cyan-400" />
            <span className="font-mono font-bold text-cyan-300">{tempUnit === 'K' ? 'Kelvin (K)' : 'Celsius (°C)'}</span>
          </button>

          {/* Export Dropdown / Buttons */}
          <div className="relative group">
            <button
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition"
              title="Xuất dữ liệu & Tệp cấu hình"
            >
              <Download className="h-3.5 w-3.5 text-sky-400" />
              <span>Xuất DL</span>
            </button>
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 hidden group-hover:block z-50">
              <button
                onClick={handleDownloadStateCsv}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                Xuất Bảng trạng thái (CSV)
              </button>
              <button
                onClick={handleDownloadExpCsv}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4 text-cyan-400" />
                Xuất Dữ liệu Thực nghiệm (CSV)
              </button>
              <button
                onClick={handleDownloadConfig}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
              >
                <Download className="h-4 w-4 text-sky-400" />
                Lưu cấu hình mô phỏng (JSON)
              </button>
              <button
                onClick={handleCaptureScreen}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
              >
                <Camera className="h-4 w-4 text-amber-400" />
                In / Xuất Báo cáo PDF
              </button>
            </div>
          </div>

          {/* Import JSON */}
          <button
            onClick={handleImportClick}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition"
            title="Nạp cấu hình từ tệp JSON"
          >
            <Upload className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Nạp JSON</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />

          {/* Dark / Light Mode Switch */}
          <button
            onClick={toggleDarkMode}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition"
            title={isDarkMode ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối'}
          >
            {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-200" />}
          </button>
        </div>
      </div>
    </header>
  );
};
