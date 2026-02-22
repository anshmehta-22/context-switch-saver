// src/components/StatusBadge.jsx
// Coloured pill that reflects snapshot status.

const STYLES = {
  active:   'bg-green-100  text-green-700',
  paused:   'bg-yellow-100 text-yellow-700',
  complete: 'bg-gray-100   text-gray-500',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`badge ${STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}