import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from 'lucide-react';
import { Button } from './Button';

export interface Column<T> {
  key: string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T extends { id?: string }>({
  data,
  columns,
  pageSize = 10,
  onRowClick,
  emptyMessage = 'Keine Daten verfügbar',
  className = '',
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const sortedData = useMemo(() => {
    if (!sortColumn) return data;

    const column = columns.find((col) => col.key === sortColumn);
    if (!column || !column.sortable) return data;

    return [...data].sort((a, b) => {
      const aVal = column.accessor(a);
      const bVal = column.accessor(b);

      // Simple string/number comparison
      const aStr = String(aVal ?? '');
      const bStr = String(bVal ?? '');

      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }, [data, sortColumn, sortDirection, columns]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const handleSort = (columnKey: string) => {
    const column = columns.find((col) => col.key === columnKey);
    if (!column || !column.sortable) return;

    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  if (data.length === 0) {
    return (
      <div className={`bg-surface rounded-lg border border-white/10 p-12 text-center ${className}`}>
        <p className="text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`bg-surface rounded-lg border border-white/10 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left text-sm font-medium text-gray-300 ${
                    column.sortable ? 'cursor-pointer hover:bg-white/10' : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && (
                      <ArrowUpDown
                        size={14}
                        className={`${
                          sortColumn === column.key
                            ? 'text-accent'
                            : 'text-gray-500 opacity-0 group-hover:opacity-100'
                        }`}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {paginatedData.map((row, index) => (
              <tr
                key={row.id || index}
                className={`hover:bg-white/5 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-sm text-white">
                    {column.accessor(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
          <div className="text-sm text-gray-400">
            Zeige {startIndex + 1} - {Math.min(endIndex, sortedData.length)} von {sortedData.length}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2"
            >
              <ChevronsLeft size={16} />
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2"
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="text-sm text-gray-400 px-2">
              Seite {currentPage} von {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2"
            >
              <ChevronRight size={16} />
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2"
            >
              <ChevronsRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


