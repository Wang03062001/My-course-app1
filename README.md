my-course-app/
├─ package.json
├─ next.config.js
├─ .env.local          # biến môi trường, DB connection, API keys
├─ public/             # lưu hình ảnh, favicon, icon
│   ├─ images/
│   └─ videos/         # nếu bạn muốn lưu video offline
├─ app/                # Next.js 14 app router
│   ├─ layout.jsx      # layout chung (header/footer/sidebar)
│   ├─ page.jsx        # trang chủ
│   ├─ login/
│   │   └─ page.jsx    # trang login
│   ├─ dashboard/
│   │   ├─ page.jsx    # trang dashboard người dùng
│   │   ├─ courses/
│   │   │   ├─ page.jsx        # danh sách khóa học
│   │   │   └─ [courseId]/
│   │   │       └─ page.jsx    # chi tiết khóa học + video/audio
│   │   └─ profile/
│   │       └─ page.jsx        # profile người dùng
│   └─ api/            # API routes cho database
│       ├─ auth/
│       │   ├─ login.js
│       │   └─ logout.js
│       ├─ courses/
│       │   ├─ index.js         # lấy danh sách khóa học
│       │   └─ [courseId].js   # lấy chi tiết khóa học
│       └─ users/
│           └─ [userId].js
├─ components/         # React components dùng chung
│   ├─ Navbar.jsx
│   ├─ Footer.jsx
│   ├─ VideoPlayer.jsx  # nhúng YouTube hoặc video host
│   └─ AudioPlayer.jsx
├─ hooks/              # custom hooks
│   └─ useAuth.js      # quản lý login/logout, localStorage
├─ lib/                # thư viện helper
│   ├─ db.js           # kết nối database
│   └─ auth.js         # xác thực token, session
├─ styles/             # CSS / Tailwind / SCSS
│   ├─ globals.css
│   └─ components.css
└─ node_modules/
