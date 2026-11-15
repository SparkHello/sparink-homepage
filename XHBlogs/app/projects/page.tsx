import ProjectsBoard from "./ProjectsBoard";
import "../../components/atelier/secondary.css";

export const metadata = {
  title: "作品与实验",
  description: "Sparink 的 AI Agent、长期记忆和个人软件项目。",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  return <ProjectsBoard />;
}
