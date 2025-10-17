import React from 'react';

const PaginationButton = ({ label, handleClick, disabled }) => (
  <button onClick={handleClick} disabled={disabled} className="load-more-btn">
    {label}
  </button>
);

const Pagination = ({ page, totalPages, setPage, loading }) => {
  if (loading || totalPages <= 1) return null;

  return (
    <div className="pagination">
      <PaginationButton
        label="First"
        handleClick={() => setPage(1)}
        disabled={page === 1}
      />
      <PaginationButton
        label="Prev"
        handleClick={() => setPage((p) => Math.max(p - 1, 1))}
        disabled={page === 1}
      />

      <span className="load-more-btn">
        Page {page} of {totalPages}
      </span>

      <PaginationButton
        label="Next"
        handleClick={() => setPage((p) => Math.min(p + 1, totalPages))}
        disabled={page === totalPages}
      />
      <PaginationButton
        label="Last"
        handleClick={() => setPage(totalPages)}
        disabled={page === totalPages}
      />
    </div>
  );
};

export default Pagination;
