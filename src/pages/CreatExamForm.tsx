import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';

export default function CreatExamForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  
  // 1. Thêm State để quản lý vùng nhập JSON
  const [isJsonMode, setIsJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState("");

  const { register, control, handleSubmit, reset } = useForm({
    defaultValues: {
      title: "",
      description: "",
      durationMinutes: 60,
      passingScore: 5,
      questions: [
        {
          content: "",
          explanation: "",
          scoreWeight: 1,
          correctOptionIndex: "0",
          options: [
            { content: "" },
            { content: "" },
            { content: "" },
            { content: "" }
          ]
        }
      ]
    }
  });

  const { fields: questions, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control,
    name: "questions"
  });

  // 2. Hàm xử lý nạp JSON từ Textarea
  const handleImportJsonText = () => {
    if (!jsonText.trim()) {
      alert("⚠️ Vui lòng dán mã JSON vào ô trống!");
      return;
    }

    try {
      const parsedData = JSON.parse(jsonText);

      // Cập nhật State cho Tags
      if (parsedData.tags && Array.isArray(parsedData.tags)) {
        setTags(parsedData.tags);
      } else {
        setTags([]);
      }

      // Đổ dữ liệu vào form
      reset({
        title: parsedData.title || "",
        description: parsedData.description || "",
        durationMinutes: parsedData.durationMinutes || 60,
        passingScore: parsedData.passingScore || 5,
        questions: parsedData.questions && parsedData.questions.length > 0 
          ? parsedData.questions 
          : [{ content: "", explanation: "", scoreWeight: 1, correctOptionIndex: "0", options: [{ content: "" }, { content: "" }, { content: "" }, { content: "" }] }]
      });

      alert("✅ Đã nạp dữ liệu JSON thành công!");
      setIsJsonMode(false); // Ẩn ô nhập đi cho gọn
      setJsonText(""); // Xóa trắng ô nhập
    } catch (error) {
      console.error("Lỗi parse JSON:", error);
      alert("❌ Mã JSON không hợp lệ (Sai cú pháp, thiếu ngoặc, dư dấu phẩy...). Vui lòng kiểm tra lại!");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); 
      const newTag = tagInput.trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]); 
      }
      setTagInput(""); 
    }
  };

  const removeTag = (indexToRemove: number) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  const onSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        durationMinutes: formData.durationMinutes,
        passingScore: formData.passingScore,
        tags: tags,
        questions: formData.questions.map((q: any) => ({
          content: q.content,
          explanation: q.explanation,
          scoreWeight: q.scoreWeight,
          options: q.options.map((opt: any, index: number) => ({
            content: opt.content,
            isCorrect: index.toString() === q.correctOptionIndex.toString()
          }))
        }))
      };

      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("⚠️ Vui lòng đăng nhập để thực hiện chức năng này!");
        setIsSubmitting(false);
        return; 
      }

      const response = await fetch("http://localhost:8082/api/v1/exam/exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("🎉 Tạo đề thi thành công!");
        reset(); 
        setTags([]); 
      } else {
        alert(`❌ Có lỗi xảy ra (Mã: ${response.status}). Vui lòng kiểm tra lại.`);
      }
    } catch (error) {
      console.error("Lỗi gọi API:", error);
      alert("❌ Không thể kết nối tới Server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 rounded-2xl shadow-sm border border-slate-200">
      
      {/* HEADER & NÚT TOGGLE */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">📝 Tạo Đề Thi Mới</h2>
        
        <button 
          type="button" 
          onClick={() => setIsJsonMode(!isJsonMode)}
          className={`px-4 py-2 rounded-xl font-bold transition-colors flex items-center gap-2 border ${isJsonMode ? 'bg-slate-200 text-slate-700 border-slate-300' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-300'}`}
        >
          {isJsonMode ? "✖ Đóng khung nhập JSON" : "📝 Dán mã JSON"}
        </button>
      </div>

      {/* VÙNG NHẬP JSON (Sẽ ẩn/hiện dựa vào state isJsonMode) */}
      {isJsonMode && (
        <div className="bg-slate-800 p-4 rounded-xl mb-6 shadow-inner animate-fade-in">
          <label className="block font-semibold mb-2 text-emerald-400">Dán trực tiếp đoạn mã JSON vào đây:</label>
          <textarea 
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="w-full h-48 bg-slate-900 text-emerald-300 p-3 rounded-lg font-mono text-sm border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
            placeholder={`{\n  "title": "Tên bài thi",\n  "tags": ["Toán", "Khó"],\n  "questions": [...]\n}`}
          />
          <div className="flex justify-end mt-3">
            <button 
              type="button" 
              onClick={handleImportJsonText}
              className="bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-600 transition-colors"
            >
              🚀 Đổ dữ liệu vào Form
            </button>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* THÔNG TIN CHUNG */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <label className="block font-semibold mb-1 text-slate-700">Tiêu đề bài thi:</label>
            <input {...register("title", { required: true })} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="VD: Đề thi thử Spring Boot 2026" />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-slate-700">Mô tả (Không bắt buộc):</label>
            <textarea {...register("description")} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={2} placeholder="Nhập mô tả..." />
          </div>

          {/* GIAO DIỆN NHẬP TAG MỚI */}
          <div>
            <label className="block font-semibold mb-1 text-slate-700">Từ khóa (Tags):</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, index) => (
                <span key={index} className="bg-cyan-100 text-cyan-800 px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2">
                  {tag}
                  <button type="button" onClick={() => removeTag(index)} className="text-cyan-600 hover:text-rose-500 focus:outline-none">&times;</button>
                </span>
              ))}
            </div>
            <input 
              type="text" 
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="Nhập tag và nhấn Enter (VD: Java, Spring...)" 
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block font-semibold mb-1 text-slate-700">Thời gian (Phút):</label>
              <input type="number" {...register("durationMinutes", { valueAsNumber: true })} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex-1">
              <label className="block font-semibold mb-1 text-slate-700">Điểm đỗ:</label>
              <input type="number" {...register("passingScore", { valueAsNumber: true })} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        </div>

        {/* DANH SÁCH CÂU HỎI */}
        {questions.map((question, qIndex) => (
          <div key={question.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative transition-all hover:border-blue-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-800">Câu hỏi {qIndex + 1}</h3>
              {questions.length > 1 && (
                <button type="button" onClick={() => removeQuestion(qIndex)} className="text-rose-500 text-sm hover:underline font-semibold bg-rose-50 px-3 py-1 rounded-md">
                  🗑 Xóa câu này
                </button>
              )}
            </div>

            <div className="space-y-4">
              <input {...register(`questions.${qIndex}.content`, { required: true })} className="w-full border-b-2 border-slate-200 p-2 focus:border-blue-500 outline-none text-lg transition-colors" placeholder="Nhập nội dung câu hỏi..." />
              
              <input {...register(`questions.${qIndex}.explanation`)} className="w-full border border-slate-200 p-2.5 rounded-lg text-sm text-slate-600 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="💡 Lời giải thích (Hiển thị sau khi làm xong)..." />

              <div className="pl-4 space-y-3 mt-4">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Các đáp án (Tích chọn đáp án đúng):</p>
                {question.options?.map((_, optIndex) => (
                  <div key={optIndex} className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      value={optIndex.toString()} 
                      {...register(`questions.${qIndex}.correctOptionIndex`)} 
                      className="w-5 h-5 text-blue-600 cursor-pointer accent-blue-600" 
                    />
                    <input {...register(`questions.${qIndex}.options.${optIndex}.content`)} className="flex-1 border-b border-slate-200 p-2 focus:border-blue-400 outline-none transition-colors" placeholder={`Lựa chọn ${optIndex + 1}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* CÁC NÚT ĐIỀU KHIỂN DƯỚI CÙNG */}
        <div className="flex justify-between items-center pt-6">
          <button 
            type="button" 
            onClick={() => appendQuestion({ content: "", explanation: "", scoreWeight: 1, correctOptionIndex: "0", options: [{ content: "" }, { content: "" }, { content: "" }, { content: "" }] })}
            className="bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-300 transition-colors flex items-center gap-2"
          >
            ➕ Thêm câu hỏi
          </button>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:bg-blue-400 disabled:shadow-none"
          >
            {isSubmitting ? "⏳ Đang lưu..." : "💾 LƯU ĐỀ THI VÀO HỆ THỐNG"}
          </button>
        </div>
      </form>
    </div>
  );
}