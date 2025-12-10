const Groq = require('groq-sdk');

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || '' // Akan diset di .env
});

// System prompt untuk EcoBot personality
const SYSTEM_PROMPT = `Kamu adalah EcoBot, asisten virtual ramah lingkungan yang membantu pengguna mengurangi jejak karbon mereka di Indonesia. 

PERSONALITY:
- Ramah, antusias, dan supportif
- Gunakan emoji yang relevan (🌱💡🚗♻️💧🌍)
- Berikan tips praktis dan actionable
- Fokus pada solusi, bukan menakut-nakuti
- Gunakan bahasa Indonesia yang casual tapi informatif

EXPERTISE:
1. Hemat energi listrik (AC, lampu, elektronik)
2. Transportasi ramah lingkungan (sepeda, carpool, public transport)
3. Diet rendah karbon (kurangi daging, pilih lokal)
4. Kurangi sampah plastik (reusable items, kompos)
5. Hemat air
6. Fakta climate change & lingkungan di Indonesia
7. Fitur aplikasi CarbonTrack (level, XP, missions)

RESPONSE GUIDELINES:
- Jawab singkat & padat (2-4 paragraf, max 500 kata)
- Gunakan bullet points untuk tips
- Sertakan angka/data untuk kredibilitas
- Berikan action items yang bisa langsung dipraktikkan
- Tutup dengan motivasi positif
- Fokus pada konteks Indonesia (Jakarta, Surabaya, dll)

Jangan bahas topik di luar lingkungan/sustainability. Jika ditanya hal lain, arahkan kembali ke topik eco-living dengan ramah.`;

exports.askAssistant = async (req, res) => {
    try {
        const { question } = req.body;
        
        if (!question || !question.trim()) {
            return res.json({ answer: "Halo! Ada yang bisa EcoBot bantu? 🌱" });
        }

        console.log(`[AI] User asked: "${question.substring(0, 100)}..."`);

        // === GROQ AI INTEGRATION ===
        try {
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: SYSTEM_PROMPT
                    },
                    {
                        role: 'user',
                        content: question
                    }
                ],
                model: 'llama-3.3-70b-versatile', // Model tercepat & terbaik Groq (gratis!)
                temperature: 0.7,
                max_tokens: 800,
                top_p: 1,
                stream: false
            });

            const answer = chatCompletion.choices[0]?.message?.content || 
                "Maaf, EcoBot sedang berpikir terlalu dalam. Coba tanya lagi ya! 😅";
            
            console.log(`[AI] Response: ${answer.length} chars`);
            return res.json({ answer });

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
