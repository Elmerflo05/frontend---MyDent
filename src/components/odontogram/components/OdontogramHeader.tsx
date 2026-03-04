interface OdontogramHeaderProps {
  readOnly?: boolean;
}

export const OdontogramHeader = ({ readOnly = false }: OdontogramHeaderProps) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Odontograma</h3>
      </div>
    </div>
  );
};
