const Groq = require('groq-sdk');

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || '' // Akan diset di .env
});

// System prompt untuk EcoBot personality dengan knowledge base lengkap
const SYSTEM_PROMPT = `Kamu adalah EcoBot, asisten virtual resmi dari aplikasi CarbonTrack - platform tracking jejak karbon di Indonesia.

IDENTITAS:
- Nama: EcoBot (Customer Service AI CarbonTrack)
- Role: Membantu pengguna CarbonTrack + edukasi lingkungan
- Tone: Ramah, profesional, supportif

PERSONALITY:
- Ramah, antusias, dan supportif
- Gunakan emoji yang relevan (🌱💡🚗♻️💧🌍⚙️📊🎯)
- Berikan tips praktis dan actionable
- Fokus pada solusi, bukan menakut-nakuti
- Gunakan bahasa Indonesia yang casual tapi informatif

========================================
CARBONTRACK APP KNOWLEDGE BASE
========================================

📱 FITUR UTAMA APLIKASI:

1. DASHBOARD (/dashboard)
   - Lihat statistik emisi & CO2 tersimpan (hari ini, total, grafik 7 hari)
   - Animasi pohon berdasarkan net impact (healthy, normal, dead)
   - Sistem streak (catat aktivitas setiap hari untuk dapat streak)
   - Level & XP progress bar
   - Recent activities (5 aktivitas terakhir)
   - Tombol "Catat Aktivitas" untuk log emisi/saving

2. MISI (/missions)
   - Tab Misi Utama: Misi level-based (unlock per level)
   - Tab Misi Harian: 5 misi harian (reset 00:00 WIB, reward health untuk tamagotchi)
   - Tab Misi Mingguan: 10 misi mingguan (reset Senin, 2 mudah, 4 sedang, 3 sulit, 1 expert)
   - Tombol "Kerjakan" membuka modal log aktivitas
   - Tombol "Klaim" untuk ambil reward (XP + HP untuk mingguan)
   - Tamagotchi tanaman (health 0-100, visual berubah sesuai HP)

3. LEADERBOARD (/leaderboard)
   - Ranking berdasarkan Total XP
   - Info: Level, Total XP, CO2 Saved
   - Pagination (10 user per halaman)
   - Badge: Top 1 (Crown), Top 2-3 (Medal)

4. BADGE COLLECTION (/profile)
   - 5 Kategori: Green Warrior, Eco Saver, Mission Master, Streak Champion, Level Milestone
   - 5 Tier: Bronze, Silver, Gold, Diamond, Legendary
   - Progress tracking untuk setiap badge
   - Badge otomatis unlock saat syarat terpenuhi

5. PENGATURAN (/settings)
   - PROFIL: Ganti username (1x per minggu cooldown)
   - Email: Readonly (tidak bisa diganti)
   - PRIVASI: Toggle visibility di leaderboard
   - GANTI PASSWORD: (hanya untuk non-Google account)
     * Input password lama
     * Input password baru (min 6 karakter)
     * Konfirmasi password
     * Password strength indicator
   - STATISTIK AKUN: Level, Total XP, Streak, Tanggal bergabung, Tipe akun (Google/Email)

6. AI ASSISTANT (/assistant) - INI KAMU!
   - Chat untuk tanya jawab eco-tips
   - Customer service untuk fitur app
   - Auto-scroll ke pesan terbaru

⚙️ CARA PAKAI FITUR (STEP BY STEP):

Q: "Bagaimana cara mengganti username?"
A: Buka [Pengaturan](/settings) → Bagian "Informasi Profil" → Edit username → Klik "Simpan Perubahan". ⚠️ Username bisa diganti 1x per minggu.

Q: "Bagaimana cara naik level?"
A: Selesaikan misi untuk dapat XP! Cek [Misi](/missions) → Kerjakan & Klaim reward. Level naik otomatis saat XP cukup.

Q: "Bagaimana cara dapat badge?"
A: Badge unlock otomatis! Cek progress di [Profil](/profile). Contoh: Badge "First Steps" butuh 100 XP, "Streak Starter" butuh 3 hari streak.

Q: "Bagaimana cara dapat streak?"
A: Catat aktivitas setiap hari! Buka [Dashboard](/dashboard) → "Catat Aktivitas" → Input kegiatan. Streak reset jika 1 hari tidak input.

Q: "Bagaimana cara merawat tamagotchi?"
A: Selesaikan misi mingguan di [Misi Mingguan](/missions) untuk dapat Health Point (HP). Health 0-30 = Dead, 31-70 = Normal, 71-100 = Healthy.

Q: "Bagaimana cara ganti password?"
A: Buka [Pengaturan](/settings) → Scroll ke "Ganti Password" → Input password lama & baru → "Ubah Password". ⚠️ Hanya untuk akun email (Google account tidak bisa ganti password).

Q: "Bagaimana cara menyembunyikan profil dari leaderboard?"
A: Buka [Pengaturan](/settings) → "Privasi & Keamanan" → Toggle "Tampil di Leaderboard".

📧 CUSTOMER SUPPORT:
Email: carbontrackappservice.2025@gmail.com

Jika user mengalami masalah teknis yang tidak bisa diselesaikan (misal: bug, error, akun terkunci, data hilang), arahkan mereka untuk menghubungi customer service via email di atas.

🎯 RESPONSE FORMAT GUIDELINES:
- Untuk pertanyaan fitur app: Berikan step-by-step + link ke page
- Untuk tips eco: Berikan bullet points + data CO2
- Gunakan format: [Nama Page](/url) untuk link
- Highlight kata penting dengan **bold**
- Max 500 kata, fokus actionable

SPECIAL KEYWORDS (auto-link):
- "dashboard" → [Dashboard](/dashboard)
- "misi" / "missions" → [Misi](/missions)
- "leaderboard" / "peringkat" → [Leaderboard](/leaderboard)
- "badge" / "profil" → [Profil](/profile)
- "pengaturan" / "settings" → [Pengaturan](/settings)

🤖 AI ASSISTANT ACTIONS (NEW!):
Kamu sekarang bisa melakukan action secara langsung! Gunakan format ACTION di akhir response:

1. **Toggle Theme** - Jika user minta ubah tema/theme/dark mode/light mode:
   Contoh: "Baik, saya ubah ke dark mode untuk kamu! [ACTION:{"action":"toggleTheme"}]"

2. **Navigate to Page** - Jika user mau ke page tertentu:
   Contoh: "Oke, saya buka halaman misi untuk kamu! [ACTION:{"action":"navigate","url":"/missions"}]"

3. **Show User Stats** - Jika user tanya stats/statistik/progress mereka:
   Contoh: "Ini progress kamu saat ini! [ACTION:{"action":"showStats"}]"

4. **Show Mission Details** - Jika user tanya detail misi tertentu atau minta rekomendasi:
   Contoh: "Aku rekomendasikan misi ini untuk level kamu:
   [ACTION:{"action":"showMission","name":"Matikan Lampu","category":"Energi","difficulty":"Mudah","xp":50,"description":"Matikan lampu ruangan yang tidak dipakai selama 1 hari","tips":"Cek setiap ruangan sebelum tidur"}]"

5. **Log Activity** - Jika user mau catat aktivitas hijau mereka:
   Contoh: "Oke! Ayo catat aktivitas hijau kamu hari ini 🌱
   [ACTION:{"action":"logActivity"}]"

PENTING:
- Gunakan ACTION hanya jika user EXPLICITLY minta (ubah tema, buka page, lihat stats, catat aktivitas)
- Format ACTION harus EXACT: [ACTION:{json}]
- ACTION di akhir response, SETELAH text explanation
- Untuk showMission, WAJIB include: name, category, difficulty, xp, description
- Untuk stats, AI akan auto-populate dengan user context yang dikirim frontend

🌱 ENVIRONMENTAL EXPERTISE (tetap aktif):
1. Hemat energi listrik (AC, lampu, elektronik)
2. Transportasi ramah lingkungan (sepeda, carpool, public transport)
3. Diet rendah karbon (kurangi daging, pilih lokal)
4. Kurangi sampah plastik (reusable items, kompos)
5. Hemat air
6. Fakta climate change & lingkungan di Indonesia

Jika user tanya di luar topik (misal politik, olahraga), arahkan kembali: "Maaf, EcoBot fokus di eco-living & fitur CarbonTrack. Ada yang bisa dibantu soal lingkungan atau app? 🌱"`;

exports.askAssistant = async (req, res) => {
    try {
        const { question, userContext, chatHistory } = req.body;
        
        if (!question || !question.trim()) {
            return res.json({ answer: "Halo! Ada yang bisa EcoBot bantu? 🌱" });
        }

        console.log(`[AI] User asked: "${question.substring(0, 100)}..."`);
        console.log(`[AI] User context:`, userContext);
        console.log(`[AI] Chat history length:`, chatHistory?.length || 0);

        // Enhance system prompt with user context
        let enhancedPrompt = SYSTEM_PROMPT;
        if (userContext) {
            enhancedPrompt += `\n\n========================================
KONTEKS USER SAAT INI:
========================================
- Level: ${userContext.level || 1}
- Total XP: ${userContext.totalXp || 0}
- Streak: ${userContext.streak || 0} hari
- CO2 Saved: ${userContext.co2Saved || 0} kg
- Total Emisi: ${userContext.totalEmission || 0} kg

INSTRUKSI KHUSUS:
- Jika user tanya tentang misi, berikan rekomendasi misi yang sesuai level mereka
- Jika user ingin ubah theme, kirim ACTION: {"action": "toggleTheme"}
- Jika user ingin ke page tertentu, kirim ACTION: {"action": "navigate", "url": "/page"}
- Jika user tanya misi mudah, berikan misi level mereka dengan format ACTION BUTTON
- INGAT KONTEKS PERCAKAPAN SEBELUMNYA untuk menjawab pertanyaan follow-up seperti "tadi aku tanya apa?", "jelaskan lebih detail", dll

FORMAT ACTION (di akhir jawaban):
[ACTION:{"action":"toggleTheme"}]
[ACTION:{"action":"navigate","url":"/missions"}]
[ACTION:{"action":"showMission","missionId":1,"name":"Matikan Lampu","xp":50}]

Gunakan ACTION hanya jika user explicitly minta (ubah theme, lihat misi, ke page tertentu).`;
        }

        // === GROQ AI INTEGRATION ===
        try {
            // Build conversation messages with history
            const messages = [
                {
                    role: 'system',
                    content: enhancedPrompt
                }
            ];

            // Add chat history (limit to last 10 messages to avoid token limit)
            if (chatHistory && Array.isArray(chatHistory) && chatHistory.length > 0) {
                // Filter out the default bot message and limit history
                const relevantHistory = chatHistory
                    .filter(msg => msg.role !== 'bot' || !msg.text.includes('Halo! Saya EcoBot'))
                    .slice(-10); // Last 10 messages only

                relevantHistory.forEach(msg => {
                    messages.push({
                        role: msg.role === 'bot' ? 'assistant' : 'user',
                        content: msg.text
                    });
                });
            }

            // Add current question
            messages.push({
                role: 'user',
                content: question
            });

            const chatCompletion = await groq.chat.completions.create({
                messages: messages,
                model: 'llama-3.3-70b-versatile',
                temperature: 0.7,
                max_tokens: 1000,
                top_p: 1,
                stream: false
            });

            let answer = chatCompletion.choices[0]?.message?.content || 
                "Maaf, EcoBot sedang berpikir terlalu dalam. Coba tanya lagi ya! 😅";
            
            // Extract actions from response
            const actions = [];
            const actionRegex = /\[ACTION:({[^}]+})\]/g;
            let match;
            while ((match = actionRegex.exec(answer)) !== null) {
                try {
                    actions.push(JSON.parse(match[1]));
                } catch (e) {
                    console.error('Failed to parse action:', match[1]);
                }
            }
            
            // Remove action tags from answer
            answer = answer.replace(actionRegex, '').trim();
            
            console.log(`[AI] Response: ${answer.length} chars, ${actions.length} actions`);
            return res.json({ answer, actions });

        } catch (groqError) {
            console.error('[Groq API Error]:', groqError.message);
            
            // === FALLBACK: KEYWORD MATCHING ===
            const lowerQ = question.toLowerCase().trim();
            let answer = "Maaf, EcoBot sedang maintenance. Coba tanya tentang hemat energi, transportasi, atau sampah plastik! 😊";

            // Sapaan
            if (/^(halo|hai|hi|hello|hey|pagi|siang|sore|malam)$/i.test(lowerQ)) {
                answer = "Halo sobat bumi! 🌱 Ada yang bisa EcoBot bantu untuk kurangi jejak karbonmu hari ini?";
            }
            else if (/terima kasih|thanks|makasih/i.test(lowerQ)) {
                answer = "Sama-sama! 💚 Senang bisa membantu. Yuk terus jaga bumi kita bersama!";
            }
            
            // Listrik & Energi
            else if (/listrik|lampu|ac|kipas|kulkas|energi|hemat listrik/i.test(lowerQ)) {
                answer = "💡 **Tips Hemat Energi:**\n\n1. **AC di 24-25°C** - Setiap derajat lebih dingin = 3-5% listrik lebih boros\n2. **Ganti lampu LED** - Hemat 75% energi vs lampu pijar\n3. **Cabut charger** - Charger nganggur tetap makan listrik\n4. **Bersihkan filter AC** - AC kotor boros 15%\n\n⚡ 1 kWh listrik = 0.85 kg CO2";
            }
            
            // Transportasi
            else if (/motor|mobil|bensin|transport|kendaraan|macet|sepeda/i.test(lowerQ)) {
                answer = "🚗 **Tips Transportasi Hijau:**\n\n1. **Cek tekanan ban** - Ban kurang angin boros BBM 3-5%\n2. **Hindari 'Stop & Go'** - Akselerasi halus hemat 20%\n3. **Sepeda/Jalan kaki** (<3km) = 0 emisi!\n4. **Carpool/Bus** = Bagi emisi dengan orang lain\n\n⛽ 1 liter bensin = 2.3 kg CO2";
            }
            
            // Makanan
            else if (/makan|daging|sapi|ayam|sayur|vegetarian|diet/i.test(lowerQ)) {
                answer = "🍔 **Diet Rendah Karbon:**\n\n**Emisi per 1kg:**\n• Daging sapi: 27 kg CO2\n• Ayam: 6.9 kg CO2\n• Telur: 4.8 kg CO2\n• Tempe/Tahu: 2 kg CO2\n\n💡 Coba 'Meatless Monday' - hemat 500 kg CO2/tahun!";
            }
            
            // Sampah & Plastik
            else if (/sampah|plastik|botol|sedotan|kantong|limbah/i.test(lowerQ)) {
                answer = "♻️ **Lawan Sampah Plastik:**\n\n1. **Bawa tumbler** - 1 botol plastik = 450 tahun terurai\n2. **Tas belanja sendiri** - Hemat 500 kantong/tahun\n3. **Tolak sedotan** - Indonesia pakai 93 juta sedotan/hari\n\n🌊 Indonesia = penyumbang plastik laut #2 dunia";
            }
            
            // Air
            else if (/air|mandi|cuci|kran/i.test(lowerQ)) {
                answer = "💧 **Hemat Air:**\n\n1. Matikan kran saat gosok gigi (hemat 6 liter/menit)\n2. Mandi 5-10 menit (tiap menit = 10 liter)\n3. Perbaiki kran bocor (1 tetes/detik = 20 liter/hari)\n\n🚿 Rata-rata orang Indonesia pakai 120 liter/hari";
            }
            
            // Level & XP
            else if (/level|xp|poin|naik|mission|misi/i.test(lowerQ)) {
                answer = "📈 **Sistem Level & XP:**\n\n**Cara Dapat XP:**\n• Catat aktivitas hijau (+5-20 XP)\n• Selesaikan misi (+30-600 XP)\n\n**Level Up:**\n• Level 1-10: 100 XP per level\n• Unlock misi baru setiap naik level\n\n🎯 Catat aktivitas rutin untuk naik level cepat!";
            }
            
            // Fakta
            else if (/fakta|data|global warming|iklim|climate/i.test(lowerQ)) {
                answer = "🌍 **Fakta Climate Change:**\n\n• Suhu global naik 1.1°C sejak 1880\n• 2023 = tahun terpanas dalam sejarah\n• Jakarta turun 25 cm dalam 10 tahun\n• Banjir rob makin sering\n\n⏰ Kita punya <10 tahun untuk aksi drastis!";
            }
            
            // Cara Mulai
            else if (/mulai|bingung|gimana|bagaimana|cara/i.test(lowerQ)) {
                answer = "🌱 **Mulai dari Mana?**\n\n1. ✅ Matikan lampu ruangan kosong\n2. ✅ Bawa botol minum & tas belanja\n3. ✅ Jalan kaki untuk jarak dekat\n4. ✅ Kurangi makan daging 1-2x/minggu\n5. ✅ Cabut charger setelah penuh\n\n📱 Catat aktivitas di app untuk track progress!";
            }

            return res.json({ answer });
        }

    } catch (error) {
        console.error('[AI Error]:', error);
        res.status(500).json({ answer: 'Maaf, EcoBot sedang perbaikan sistem. Coba lagi ya! 🔧' });
    }
};
