import { useEffect, useState } from "react";
import axios from "axios";

interface DiscountCode {
  id: string;
  code: string;
  type: "cash" | "points";
  value: number;
  maxUses: number;
  usesCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function AdminDiscountCodes() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [form, setForm] = useState({
    code: "",
    type: "cash",
    value: 0,
    maxUses: 1,
    expiresAt: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch discount codes
  const fetchCodes = async () => {
    const res = await axios.get("/discount-codes");
    setCodes(res.data);
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  // Handle form change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Create or Update discount code
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Update
        await axios.patch(`/discount-codes/${editingId}`, {
          ...form,
          value: Number(form.value),
          maxUses: Number(form.maxUses),
        });
        setEditingId(null);
      } else {
        // Create
        await axios.post("/discount-codes", {
          ...form,
          value: Number(form.value),
          maxUses: Number(form.maxUses),
        });
      }
      setForm({ code: "", type: "cash", value: 0, maxUses: 1, expiresAt: "" });
      fetchCodes();
    } catch (err: any) {
      alert(err.response?.data?.error || "Something went wrong");
    }
  };

  // Edit a code
  const handleEdit = (code: DiscountCode) => {
    setForm({
      code: code.code,
      type: code.type,
      value: code.value,
      maxUses: code.maxUses,
      expiresAt: code.expiresAt ? code.expiresAt.split("T")[0] : "",
    });
    setEditingId(code.id);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto text-black">
      <h1 className="text-2xl font-bold mb-4">Discount Code Management</h1>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow space-y-4">
        <div>
          <label className="block font-semibold mb-1">Code</label>
          <input
            type="text"
            name="code"
            value={form.code}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-full"
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Type</label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-full"
          >
            <option value="cash">Cash</option>
            <option value="points">Points</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Value</label>
          <input
            type="number"
            name="value"
            value={form.value}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-full"
            min={1}
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Max Uses</label>
          <input
            type="number"
            name="maxUses"
            value={form.maxUses}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-full"
            min={1}
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Expiry Date</label>
          <input
            type="date"
            name="expiresAt"
            value={form.expiresAt}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-full"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {editingId ? "Update Code" : "Create Code"}
        </button>
      </form>

      {/* Codes Table */}
      <table className="w-full bg-white rounded shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Code</th>
            <th className="p-2 border">Type</th>
            <th className="p-2 border">Value</th>
            <th className="p-2 border">Max Uses</th>
            <th className="p-2 border">Uses Count</th>
            <th className="p-2 border">Expiry</th>
            <th className="p-2 border">Active</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {codes.map((code) => (
            <tr key={code.id}>
              <td className="p-2 border">{code.code}</td>
              <td className="p-2 border">{code.type}</td>
              <td className="p-2 border">{code.value}</td>
              <td className="p-2 border">{code.maxUses}</td>
              <td className="p-2 border">{code.usesCount}</td>
              <td className="p-2 border">{code.expiresAt?.split("T")[0] || "-"}</td>
              <td className="p-2 border">{code.isActive ? "Yes" : "No"}</td>
              <td className="p-2 border">
                <button
                  onClick={() => handleEdit(code)}
                  className="bg-yellow-500 text-white px-2 py-1 rounded"
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
          {codes.length === 0 && (
            <tr>
              <td colSpan={8} className="p-4 text-center text-gray-500">
                No discount codes found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
