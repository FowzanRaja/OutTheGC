import { Badge } from "./ui/Badge";

interface Member {
  id: string;
  name: string;
  role: "organiser" | "member";
  has_submitted_constraints: boolean;
}

interface MemberProgressListProps {
  members: Member[];
}

export const MemberProgressList: React.FC<MemberProgressListProps> = ({ members }) => {
  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700"
        >
          <div>
            <p className="font-medium text-white">{member.name}</p>
            <div className="flex gap-2 mt-1">
              <Badge>{member.role}</Badge>
              {member.has_submitted_constraints ? (
                <Badge>✓ Submitted</Badge>
              ) : (
                <span className="inline-flex items-center rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                  Pending
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
