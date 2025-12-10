exports.askAssistant = async (req, res) => {
    try {
        const { question } = req.body;
        const lowerQ = question ? question.toLowerCase() : "";

        let answer = "Maaf, EcoBot belum mengerti. Coba tanya tentang 'listrik', 'transport', 'makan', atau 'sampah'.";

        // --- LOGIKA CERDAS (KEYWORD MATCHING) ---

        // 1. SAPAAN (Lebih banyak variasi)
        const sapaan = ['halo', 'hai', 'hi', 'hello', 'pagi', 'siang', 'sore', 'malam'];
        if (sapaan.some(kata => lowerQ.includes(kata))) {
            answer = "Halo sobat bumi! 🌱 Ada yang bisa EcoBot bantu untuk kurangi jejak karbonmu hari ini?";
        } 
        
        // 2. LISTRIK & ENERGI
        else if (lowerQ.includes('listrik') || lowerQ.includes('lampu') || lowerQ.includes('ac') || lowerQ.includes('energi')) {
            answer = "💡 **Tips Hemat Energi:**\n1. Atur AC di suhu 24-25°C (hemat 10% listrik).\n2. Ganti lampu pijar dengan LED.\n3. Cabut charger laptop/HP jika sudah penuh (vampire power).";
        } 
        
        // 3. TRANSPORTASI
        else if (lowerQ.includes('motor') || lowerQ.includes('mobil') || lowerQ.includes('bensin') || lowerQ.includes('macet') || lowerQ.includes('jalan')) {
            answer = "🚗 **Tips Transportasi Hijau:**\n1. Cek tekanan ban rutin (ban kempes boros BBM 5%).\n2. Hindari 'Stop & Go' mendadak.\n3. Kalau dekat, jalan kaki atau naik sepeda saja, sehat dan nol emisi!";
        } 
        
        // 4. SAMPAH & PLASTIK
        else if (lowerQ.includes('sampah') || lowerQ.includes('plastik') || lowerQ.includes('botol') || lowerQ.includes('sedotan')) {
            answer = "🥤 **Lawan Plastik:**\nIndonesia penyumbang sampah plastik ke laut terbesar ke-2. Yuk bawa tumbler dan tas belanja sendiri! Kamu bisa hemat Rp 500rb/tahun lho.";
        } 
        
        // 5. MAKANAN & DAGING
        else if (lowerQ.includes('makan') || lowerQ.includes('daging') || lowerQ.includes('sayur') || lowerQ.includes('sapi')) {
            answer = "🍔 **Diet Karbon:**\nProduksi 1kg daging sapi menghasilkan 27kg CO2! Coba tantangan 'Meatless Monday' (Senin Tanpa Daging), ganti dengan tempe/tahu/telur.";
        }
        
        // 6. AIR
        else if (lowerQ.includes('air') || lowerQ.includes('mandi') || lowerQ.includes('cuci')) {
            answer = "💧 **Hemat Air:**\nMatikan kran saat gosok gigi! Kebiasaan ini bisa menghemat hingga 6 liter air per menit.";
        }

        // 7. LEVEL & XP (Fitur Aplikasi)
        else if (lowerQ.includes('level') || lowerQ.includes('xp') || lowerQ.includes('poin')) {
            answer = "📈 **Tentang Level:**\nSetiap kamu mencatat aktivitas hemat karbon atau klaim misi, kamu dapat XP. Naikkan levelmu dari 'Newbie' sampai jadi 'Earth Protector'!";
        }

        res.json({ answer });

    } catch (error) {
        console.error(error);
        res.status(500).json({ answer: 'Maaf, EcoBot sedang perbaikan sistem.' });
    }
};