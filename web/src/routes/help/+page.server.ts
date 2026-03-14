import { db } from '$lib/server/db';
import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) throw redirect(302, '/login');
    
    // Knowledge base articles could be fetched from DB later
    const articles = [
        { id: '1', title: 'Làm thế nào để nhận thêm AI Credits?', content: 'Mỗi người dùng được cấp một lượng AI Credits miễn phí mỗi tháng tùy vào gói dịch vụ. Nếu bạn hết Credits, bạn có thể hoàn thành các thử thách hàng ngày, chuỗi ngày học để được tặng thêm, hoặc nâng cấp lên gói Pro.' },
        { id: '2', title: 'Cách khắc phục lỗi không thu âm được?', content: 'Rất có thể trình duyệt của bạn chưa được cấp quyền nhận diện giọng nói (Microphone). Hãy nhấn vào biểu tượng ổ khóa cạnh thanh địa chỉ trình duyệt, chọn Cài đặt trang web, và cho phép quyền truy cập Micro. Tải lại trang và thử lại.' },
        { id: '3', title: 'Kết nối Telegram bị lỗi?', content: 'Để kết nối, bạn cần chắc chắn đã nhập đúng username Telegram của mình vào thiết lập tài khoản. Sau đó hãy vào app Telegram, tìm @vaspeak_bot, quét mã QR trên màn hình hoặc nhắn tin chứa mã kết nối.' },
        { id: '4', title: 'Lộ trình học theo chuyên ngành (Niche)', content: 'Bạn có thể thay đổi Niche (Tiếng Anh Giao Tiếp, Thương Mại Điện Tử, Trợ Lý Giám Đốc...) trong phần Hồ sơ > Cài đặt. Các bài học và vai diễn AI sẽ được cá nhân hóa theo ngành nghề mà bạn chọn.' }
    ];

    return { articles };
};

export const actions: Actions = {
    submitFeedback: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { error: 'Unauthorized' });
        
        try {
            const data = await request.formData();
            const topic = data.get('topic')?.toString() || 'general';
            const message = data.get('message')?.toString() || '';
            const file = data.get('attachment') as File | null;
            
            if (!message.trim()) {
                return fail(400, { error: 'Vui lòng nhập nội dung phản hồi', isFeedback: true });
            }
            
            let publicUrl = null;
            if (file && file.size > 0) {
                const crypto = await import('crypto');
                const ext = file.name.split('.').pop() || 'png';
                const filename = `fb_${locals.user.id}_${crypto.randomUUID()}.${ext}`;
                const filepath = `static/uploads/feedback/${filename}`;
                publicUrl = `/uploads/feedback/${filename}`;
                
                const fs = await import('fs/promises');
                await fs.mkdir('static/uploads/feedback', { recursive: true });
                const buffer = Buffer.from(await file.arrayBuffer());
                await fs.writeFile(filepath, buffer);
            }
            
            await db.execute({
                sql: 'INSERT INTO user_feedback (user_id, topic, message, attachment_url) VALUES (?, ?, ?, ?)',
                args: [locals.user.id, topic, message, publicUrl]
            });
            
            return { success: true, isFeedback: true, message: 'Cảm ơn bạn đã gửi phản hồi!' };
        } catch (err) {
            console.error('[feedback submit error]', err);
            return fail(500, { error: 'Lỗi khi gửi phản hồi. Vui lòng thử lại sau.', isFeedback: true });
        }
    }
};
