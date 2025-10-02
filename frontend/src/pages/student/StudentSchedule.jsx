import Schedule from '../../components/common/schedule/Schedule';

const StudentSchedule = ({ user }) => {
  return <Schedule user={user} userRole="student" />;
};

export default StudentSchedule;