import React from 'react';
import { Navigate } from 'react-router-dom';

const CreatExamForm: React.FC = () => {
  return <Navigate to="/contributor/exams" replace />;
};

export default CreatExamForm;
