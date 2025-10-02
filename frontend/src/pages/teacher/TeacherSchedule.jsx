import Schedule from '../../components/common/schedule/Schedule';

const TeacherSchedule = ({ user }) => {
  return <Schedule user={user} userRole="teacher" />;
};

export default TeacherSchedule;
