# Brayton Cycle Simulator – Phòng thí nghiệm Động cơ Tuabin khí & Phản lực
*(Interactive Gas Turbine & Jet Engine Laboratory)*

Ứng dụng web tương tác mô phỏng chu trình nhiệt động lực học Brayton và Động cơ phản lực (Turbojet), được thiết kế chuyên biệt cho giảng dạy đại học các môn:
- **Nhiệt động lực học kỹ thuật** (Engineering Thermodynamics)
- **Động cơ tuabin khí** (Gas Turbines)
- **Lực đẩy hàng không vũ trụ** (Aerospace Propulsion)

Toàn bộ ứng dụng hiển thị trên **MỘT TRANG DUY NHẤT (Single-Page Engineering Dashboard)**, cho phép sinh viên quan sát đồng thời mô hình 3D cắt lớp động cơ đang quay, đồ thị nhiệt động $T-s$, $P-v$, bảng trạng thái, dashboard hiệu suất, thực nghiệm quét biến và hệ phương trình KaTeX.

---

## 🚀 Tính năng nổi bật

### 1. Ba Chế độ Mô phỏng Độc lập (Simulation Modes)
- **Mode A: Chu trình Brayton Lý tưởng (Ideal Air-Standard Brayton Cycle)**
  - Quá trình 1 → 2: Nén đoạn nhiệt thuận nghịch (Isentropic Compression)
  - Quá trình 2 → 3: Cấp nhiệt đẳng áp (Isobaric Heat Addition)
  - Quá trình 3 → 4: Giãn nở đoạn nhiệt thuận nghịch (Isentropic Expansion)
  - Quá trình 4 → 1: Thải nhiệt đẳng áp (Isobaric Heat Rejection)
  - Nghiệm giải tích hiệu suất: $\eta_{th} = 1 - \frac{1}{r_p^{(\gamma-1)/\gamma}}$
  - Điểm cực đại công riêng có ích: $r_{p,opt} = \left(\frac{T_3}{T_1}\right)^{\frac{\gamma}{2(\gamma-1)}}$

- **Mode B: Chu trình Brayton Thực tế (Real Gas Turbine Cycle)**
  - Hiệu suất đẳng biến máy nén $\eta_c$ và tuabin $\eta_t$
  - Tổn thất áp suất buồng đốt $\Delta p$
  - Sinh entropy thực tế $\Delta s > 0$
  - Hiệu suất cơ khí truyền động trục $\eta_m$
  - Hiển thị trực quan các điểm tham chiếu đẳng biến $2s$ và $4s$

- **Mode C: Động cơ Phản lực Đơn giản (Turbojet Engine Propulsion Model)**
  - Mô hình dòng hở liên tục với các mặt cắt chuẩn hàng không: $0, t0, 2, 3, 4, 5, 9$
  - Nhiệt độ và áp suất hãm dòng bay $T_{t0}, P_{t0}$ theo số Mach $M_0$
  - Cân bằng năng lượng buồng đốt xác định tỉ lệ hòa khí $f = \dot{m}_{fuel} / \dot{m}_{air}$
  - Tuabin kéo máy nén với tổn thất cơ khí
  - Kiểm tra điều kiện nghẽn dòng loa phụt (Choked Nozzle condition $P_0 \le P_{crit}$)
  - Tính toán tách bạch Lực đẩy động lượng (Momentum thrust) và Lực đẩy áp suất (Pressure thrust)
  - Suất tiêu hao nhiên liệu TSFC $[g/(kN\cdot s)]$ và hiệu suất đẩy $\eta_{prop}$, hiệu suất nhiệt $\eta_{thermal}$, hiệu suất tổng thể $\eta_{overall}$

### 2. Mô hình Động cơ 3D Cắt Lớp & Sơ đồ 2D (Engine Visualization)
- Mô hình 3D WebGL (Three.js / React Three Fiber) thể hiện cấu trúc động cơ tuabin khí đồng trục:
  - Cánh nón đón gió và cửa hút (Inlet diffuser)
  - Cụm cánh nén hướng trục nhiều tầng (Axial compressor stages) đang quay
  - Buồng đốt dạng vòng (Annular combustor) với vòi phun và ngọn lửa phát sáng
  - Cụm tuabin dãn nở nhiều tầng (Turbine stages) đang quay cùng trục
  - Loa phụt khí thải (Exhaust nozzle)
  - Các hạt dòng khí đổi màu động theo nhiệt độ nhiệt động lực học thực tế (Xanh lạnh $\to$ Lam nén $\to$ Cam cháy $\to$ Vàng xả)
  - Thẻ hiển thị áp suất và nhiệt độ tức thời tại từng trạm (P1, T1, P2, T2, P3, T3, P4, T4)
- Sơ đồ nguyên lý 2D chuẩn giáo trình (Textbook 2D Schematic) hỗ trợ chuyển đổi một chạm.
- Tùy chỉnh tốc độ hoạt hình (0.5x, 1x, 2x), tạm dừng, lùi/tiến từng quá trình.

### 3. Đồ thị Nhiệt động Lực học Đồng bộ (Thermodynamic Diagrams)
- **Đồ thị $T-s$ (Nhiệt độ - Entropy)**:
  - Dựng đường cong đẳng áp thực tế $s(T) = s_0 + c_p \ln(T/T_0)$
  - Quá trình nén/dãn nở thực tế với entropy tăng
  - Đường tham chiếu lý tưởng nét đứt
  - Đổi đơn vị trục tung giữa Kelvin (K) và Celsius (°C)
- **Đồ thị $P-v$ (Áp suất - Thể tích riêng)**:
  - Đường đẳng áp ngang và đường đẳng biến $P v^\gamma = \text{const}$
- Xuất đồ thị định dạng vector SVG và ảnh raster PNG độ phân giải cao.

### 4. Chế độ Thực nghiệm Quét biến (Parametric Sweep Experiment)
- Quét tự động ảnh hưởng của biến độc lập ($r_p, T_3, \eta_c, \eta_t, T_1$) đến:
  - Hiệu suất nhiệt $\eta_{th}$
  - Công có ích $w_{net}$
  - Công máy nén $w_c$
  - Công tuabin $w_t$
- Đánh dấu và giải thích trực quan điểm $r_{p,opt}$ đạt cực đại công riêng có ích.

### 5. Xuất nhập Dữ liệu & Báo cáo
- Xuất bảng trạng thái nhiệt động ra tệp CSV
- Xuất dữ liệu thực nghiệm ra tệp CSV
- Lưu và nạp cấu hình mô phỏng dạng tệp JSON
- In / Xuất báo cáo kết quả PDF trực tiếp từ trình duyệt

---

## 🛠️ Công nghệ Sử dụng

- **Frontend Core**: React 18 + TypeScript + Vite 6
- **Giao diện**: Tailwind CSS + Lucide Icons + Font Inter & JetBrains Mono
- **Đồ họa 3D**: Three.js + React Three Fiber + Drei
- **Đồ thị khoa học**: Plotly.js (`plotly.js-dist-min`)
- **Quản lý trạng thái**: Zustand
- **Hiển thị công thức Toán học**: KaTeX
- **Kiểm thử tự động**: Vitest

---

## 📦 Cài đặt và Chạy cục bộ

```bash
# 1. Cài đặt các gói phụ thuộc
npm install

# 2. Khởi chạy máy chủ phát triển
npm run dev

# 3. Chạy kiểm thử tự động
npm test

# 4. Đóng gói bản phát hành sản phẩm
npm run build
```

---

## 🧪 Kết quả Kiểm thử Vật lý Tự động (Unit Tests)

Bộ kiểm thử số học `src/physics/brayton.test.ts` kiểm chứng:
1. **Test A: Chu trình Lý tưởng chuẩn**: $T_1=300\text{ K}, P_1=100\text{ kPa}, r_p=8, T_3=1400\text{ K}, \gamma=1.4, c_p=1.005\text{ kJ/(kg}\cdot\text{K)}$
   - $P_2 = P_3 = 800\text{ kPa}, P_4 = 100\text{ kPa}$
   - $T_2 \approx 543.4\text{ K}, T_4 \approx 772.8\text{ K}$
   - $\eta_{th} \approx 44.8\%$
   - Sai số cân bằng năng lượng $\epsilon = (q_{in} - q_{out}) - w_{net} < 10^{-5}\text{ kJ/kg}$
2. **Test B: Đối chiếu nghiệm giải tích**: $\eta_{th} \equiv 1 - r_p^{-(\gamma-1)/\gamma}$
3. **Test C & D: Tổn thất thực tế**: $T_{2,actual} > T_{2s}$ và $T_{4,actual} > T_{4s}$ khi $\eta < 1$
4. **Test E: Entropy**: $s_2 = s_1$ (lý tưởng) và $s_2 > s_1, s_4 > s_3$ (thực tế)
5. **Test F: Điều kiện biên**: Mach 0, $r_p$ thấp, cảnh báo công âm.

---

Giữ bản quyền © 2026. Phục vụ mục đích học thuật và nghiên cứu kỹ thuật nhiệt động lực học.
