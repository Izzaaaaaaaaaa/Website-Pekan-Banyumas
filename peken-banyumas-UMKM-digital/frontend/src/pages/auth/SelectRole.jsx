import { useNavigate } from "react-router-dom";

export default function SelectRole() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-xl">
        <h1 className="text-2xl font-bold text-center mb-6">
          Pilih Role
        </h1>

        <div className="grid grid-cols-2 gap-6">
          {/* Pengunjung */}
          <div
            onClick={() => navigate("/")}
            className="cursor-pointer border rounded-xl p-6 text-center hover:shadow-md transition"
          >
            <h2 className="text-lg font-semibold">Pengunjung</h2>
            <p className="text-sm text-gray-500 mt-2">
              Lihat informasi tanpa login
            </p>
          </div>

          {/* UMKM */}
          <div
            onClick={() => navigate("/login")}
            className="cursor-pointer border rounded-xl p-6 text-center hover:shadow-md transition border-blue-500"
          >
            <h2 className="text-lg font-semibold text-blue-600">
              UMKM
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Kelola usaha & kios
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}