import TablePagination from "../shared/TablePagination";

export default function StockOrderPagination({ page, totalPages, onPageChange }) {
  return <TablePagination page={page} totalPages={totalPages} onPageChange={onPageChange} />;
}
