"use client";

import { useState, useTransition } from "react";
import { reorderCategories, updateMezmurAssignment } from "@/app/actions/admin";

export function ConfirmDeleteButton({ 
  id, 
  onDelete, 
  itemName,
  className = ""
}: { 
  id: string, 
  onDelete: (id: string) => Promise<any>, 
  itemName: string,
  className?: string
}) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(id);
    setIsDeleting(false);
    setIsConfirming(false);
  };

  if (isConfirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-500">Delete {itemName}?</span>
        <button disabled={isDeleting} onClick={handleDelete} className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition">
          {isDeleting ? "..." : "Yes"}
        </button>
        <button disabled={isDeleting} onClick={() => setIsConfirming(false)} className="px-2 py-1 bg-gray-200 text-black rounded text-xs hover:bg-gray-300 transition">
          No
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => setIsConfirming(true)} className={`text-red-500 hover:bg-red-500/10 px-3 py-1 rounded text-sm transition ${className}`}>
      Delete
    </button>
  );
}

export function MoveMezmurModal({ 
  mezmur, 
  zemarians, 
  onClose 
}: { 
  mezmur: any; 
  zemarians: any[]; 
  onClose: () => void 
}) {
  const [subCategoryId, setSubCategoryId] = useState(mezmur.subCategoryId);
  const [zemariId, setZemariId] = useState(mezmur.zemariId || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await updateMezmurAssignment(mezmur.id, subCategoryId, zemariId === "" ? null : zemariId);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1C1A18] p-6 rounded-lg w-full max-w-md border border-[#2a2622]">
        <h3 className="text-lg font-bold mb-4 text-[#E6E1D8]">Edit Assignment: {mezmur.title}</h3>
        
        <label className="block text-sm mb-2 text-[#b0a89d]">Move to Category (SubCategory ID)</label>
        <input 
           value={subCategoryId} 
           onChange={(e) => setSubCategoryId(e.target.value)}
           className="w-full bg-[#110f0e] border border-[#2a2622] p-2 rounded mb-4 text-[#E6E1D8]"
        />

        <label className="block text-sm mb-2 text-[#b0a89d]">Assign Zemari (Optional)</label>
        <select 
           value={zemariId} 
           onChange={(e) => setZemariId(e.target.value)}
           className="w-full bg-[#110f0e] border border-[#2a2622] p-2 rounded mb-6 text-[#E6E1D8]"
        >
          <option value="">-- No Zemari --</option>
          {zemarians.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border border-[#2a2622] rounded text-[#b0a89d] hover:bg-[#2a2622]">Cancel</button>
          <button disabled={loading} onClick={handleSave} className="px-4 py-2 bg-[#60a5fa] text-white rounded hover:brightness-110">
             {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CategoryOrderControls({ categories, currentIndex }: { categories: any[], currentIndex: number }) {
  const [isPending, startTransition] = useTransition();

  const move = (direction: number) => {
    if (isPending) return;
    
    const newCategories = [...categories];
    const targetIndex = currentIndex + direction;
    
    if (targetIndex < 0 || targetIndex >= newCategories.length) return;

    const temp = newCategories[currentIndex];
    newCategories[currentIndex] = newCategories[targetIndex];
    newCategories[targetIndex] = temp;

    const orderedIds = newCategories.map(c => c.id);

    startTransition(async () => {
      await reorderCategories(orderedIds);
    });
  };

  return (
    <div className="flex flex-col gap-1 items-center justify-center">
      <button 
        disabled={currentIndex === 0 || isPending} 
        onClick={() => move(-1)} 
        className="text-[#8c8273] hover:text-[#c49620] disabled:opacity-30 p-1 leading-none"
        title="Move Up"
      >
        ▲
      </button>
      <button 
        disabled={currentIndex === categories.length - 1 || isPending} 
        onClick={() => move(1)} 
        className="text-[#8c8273] hover:text-[#c49620] disabled:opacity-30 p-1 leading-none"
        title="Move Down"
      >
        ▼
      </button>
    </div>
  );
}
