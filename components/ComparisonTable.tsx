import React from 'react';
import { ComparisonTableData } from '../types';

interface ComparisonTableProps {
  data: ComparisonTableData;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ data }) => {
  if (!data || !data.headers || !data.rows || data.rows.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-md animate-fade-in bg-white dark:bg-slate-900">
      <table className="min-w-full text-base">
        <thead className="bg-slate-50 dark:bg-slate-800/50">
          <tr>
            {data.headers.map((header, index) => (
              <th
                key={index}
                scope="col"
                className="px-6 py-4 text-left text-sm font-bold text-slate-700 dark:text-slate-300 tracking-wide"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, rowIndex) => (
            <tr 
              key={rowIndex} 
              className="border-b border-slate-200 dark:border-slate-800 last:border-b-0 odd:bg-white even:bg-slate-50/50 dark:odd:bg-slate-900 dark:even:bg-slate-800/50 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors duration-150"
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-6 py-5 whitespace-pre-wrap text-slate-600 dark:text-slate-300 align-top"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};