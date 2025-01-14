import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import CommentsPanel from "../components/CommentsPanel";
import { getDocumentById } from "../core/Document";
import {
  getCommentsByDocument,
  addCommentToDocument,
  updateDocumentStatusRevisado,
} from "../core/Comments.js";
import { motion } from "framer-motion";
import { Calendar, CheckCircle, XCircle } from "lucide-react";
import DisplayNotesSidebarExample from "../components/DisplayNotesSidebarExample.tsx";
import { API_URL } from "../core/config.js";
import { decryptData } from "../utils/encryption.js";
import Header from "../components/Header";

const DocumentoViewer = () => {
  const { projectId, documentId } = useParams();
  const [document, setDocument] = useState(null);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedHighlightId, setSelectedHighlightId] = useState(null);
  let tutorId = null;
  let rol = null;

  const encryptedUserData = localStorage.getItem("userData");

  if (encryptedUserData) {
    // Desencriptar los datos
    const decryptedUserData = JSON.parse(decryptData(encryptedUserData));

    // Acceder al rol desde los datos desencriptados
    rol = decryptedUserData.rol;
    tutorId = decryptedUserData.id;
  } else {
    console.log("No se encontró el userData en localStorage");
  }

  useEffect(() => {
    fetchDocument();
    fetchComments();
  }, [projectId]);

  const fetchDocument = async () => {
    try {
      const data = await getDocumentById(projectId);
      setDocument(data);
    } catch (error) {
      setError("Error fetching document details");
    }
  };

  const handleCommentClick = (comment) => {
    try {
      const highlightAreas = JSON.parse(comment.attributes.highlightAreas);

      // Verificar si hay áreas válidas
      const validAreas = highlightAreas.filter(
        (area) => area.height > 0 && area.width > 0 && area.pageIndex >= 0
      );

      if (validAreas.length > 0) {
        setSelectedHighlightId(comment.id);
      }
    } catch (error) {
      console.error("Error parsing highlight areas:", error);
    }
  };

  const fetchComments = async () => {
    try {
      const data = await getCommentsByDocument(documentId);
      setComments(data);

      const notesWithHighlights = data.map((comment) => ({
        id: comment.id,
        content: comment.attributes.correction,
        highlightAreas: JSON.parse(comment.attributes.highlightAreas) || [],
        quote: comment.attributes.quote || "",
      }));
      setNotes(notesWithHighlights);
      return data;
    } catch (error) {
      setError("Error fetching comments");
    }
  };

  const handleAddComment = async (newComment, highlightAreas, quote) => {
    try {
      await addCommentToDocument(
        documentId,
        newComment,
        tutorId,
        highlightAreas,
        quote
      );
      fetchComments();
      fetchDocument();
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleRevisadoClick = async () => {
    try {
      await updateDocumentStatusRevisado(documentId);
      fetchDocument();
    } catch (error) {
      console.error("Error updating document status:", error);
    }
  };

  const handleAddNote = (note) => {
    handleAddComment(note.content, note.highlightAreas, note.quote);
  };


  if (error) {
    return <p className="text-red-500 mb-4">{error}</p>;
  }

  if (!document) {
    return <p>Cargando documento...</p>;
  }

  const { title, publishedAt, isRevised, documentFile } =
    document?.data?.attributes || {};

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date)) {
      return "Fecha no válida";
    }
    return date.toLocaleString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const documentUrl = documentFile
    ? `${API_URL}${documentFile.data?.[0]?.attributes?.url}`
    : null;

  if (!documentUrl) {
    return <p>No se encontró el archivo del documento.</p>;
  }

  return (
    <div>
      <Navbar />
      <Header />
      <div className="container mx-auto p-6 bg-white shadow-md rounded-lg">
        <div className="mb-2">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold mb-2 pb-3 border-b border-gray-200"
          >
            {title}
          </motion.h1>

          <div className="grid grid-cols-2 gap-4">
            {/* Fecha de creación */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4"
            >
              <div className="bg-blue-100 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500">
                  Fecha de Creación
                </h2>
                <p className="text-sm md:text-lg font-semibold text-gray-900">
                  {publishedAt
                    ? formatDate(publishedAt)
                    : "Fecha no disponible"}
                </p>
              </div>
            </motion.div>

            {/* Estado de revisión */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className={`p-4 rounded-xl shadow-sm border flex items-center space-x-4 ${
                isRevised
                  ? "bg-green-50 border-green-100"
                  : "bg-red-50 border-red-100"
              }`}
            >
              <div
                className={`p-3 rounded-lg ${
                  isRevised ? "bg-green-100" : "bg-red-100"
                }`}
              >
                {isRevised ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500">
                  Estado de Revisión
                </h2>
                <p
                  className={`text-sm md:text-lg font-semibold ${
                    isRevised ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {isRevised ? "Revisado" : "Pendiente"}
                </p>
              </div>
            </motion.div>

            
          </div>

          {/* Botón para tutor */}
          {rol === "tutor" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="col-span-3 flex justify-end m-2"
              >
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  onClick={handleRevisadoClick}
                >
                  Marcar como Revisado
                </button>
              </motion.div>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 ">
          <div className="gap-2 border rounded-lg overflow-auto">
            <CommentsPanel
              comments={comments}
              onUpdateComments={fetchComments}
              onCommentClick={handleCommentClick}
            />
          </div>

          <div
            className="bg-gray-900 rounded-lg p-2 h-full overflow-auto"
            style={{ height: "100vh", overflow: "auto" }}
          >
            <DisplayNotesSidebarExample
              fileUrl={documentUrl}
              notes={notes}
              onAddNote={handleAddNote}
              isTutor={rol === "tutor"}
              selectedHighlightId={selectedHighlightId}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentoViewer;
