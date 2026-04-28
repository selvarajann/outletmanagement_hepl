import TablePagination from "../shared/TablePagination";

export default function ProductPagination({ page, totalPages, onPageChange }) {
  return <TablePagination page={page} totalPages={totalPages} onPageChange={onPageChange} />;
}
