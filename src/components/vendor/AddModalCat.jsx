"use client";

import { useEffect, useState } from "react";
import Select from "react-select";
import toast from "react-hot-toast";

// ---------------- TREE FUNCTIONS ----------------
function insertNode(list, parentId, newNode) {
    if (!parentId) {
        list.push(newNode);
        return true;
    }
    for (let item of list) {
        if (item.id === parentId) {
            item.children.push(newNode);
            return true;
        }
        if (item.children?.length) {
            const ok = insertNode(item.children, parentId, newNode);
            if (ok) return true;
        }
    }
    return false;
}

function flatten(list, depth = 0) {
    let out = [];
    list.forEach((i) => {
        out.push({ id: i.id, label: `${"— ".repeat(depth)}${i.name}` });
        if (i.children?.length) out = out.concat(flatten(i.children, depth + 1));
    });
    return out;
}

// ---------------- COMPONENT ----------------
export default function AddModalCat({ isOpen, onClose, onCategoryAdded }) {
    const [tree, setTree] = useState([]);
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [parentId, setParentId] = useState("");
    const [status, setStatus] = useState(true);

    // Load categories when modal opens
    const load = async () => {
        try {
            const res = await fetch("http://localhost:5001/categories");
            const data = await res.json();
            setTree(data.list || []);
        } catch (err) {
            console.error("Failed to load categories", err);
        }
    };

    useEffect(() => {
        if (isOpen) load();
    }, [isOpen]);

    const save = async (finalTree) => {

        try {
            const response = await fetch("http://localhost:5001/categories", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ list: finalTree }),
            });

            if (!response.ok) throw new Error("Failed to save categories");

            toast.success("Categories saved successfully!");
            onClose();
        } catch (error) {
            console.error("Error saving categories:", error);
            toast.error("Error saving categories");
        }
    };

    const submit = async (e) => {
        e.preventDefault();
        try {

            const newTree = structuredClone(tree);

            const node = {
                id: Date.now(),
                name,
                slug,
                parentId: parentId ? Number(parentId) : null,
                status,
                children: [],
            };

            insertNode(newTree, node.parentId, node);
            await save(newTree);
            setTree(newTree);

            toast.success("Product Group added successfully!");
            onCategoryAdded?.();

            // reset form
            setName("");
            setSlug("");
            setParentId("");
            setStatus(true);
            onClose();
            onClose?.();
        } catch (error) {
            console.log("ERror", error)
        }
    };

    if (!isOpen) return null;

    const options = flatten(tree);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-[9999]">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative animate-[zoomIn_0.2s_ease]">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl"
                >
                    ✕
                </button>

                <h2 className="text-xl font-bold mb-4">Product Group</h2>

                <form onSubmit={submit} className="space-y-4">
                    <input
                        className="border p-3 rounded-md w-full"
                        placeholder="Product Group"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />

                    <input
                        className="border p-3 rounded-md w-full"
                        placeholder="Slug"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        required
                    />

                    <Select
                        className="w-full"
                        classNamePrefix="react-select"
                        options={[
                            { value: "", label: "(Root category)" },
                            ...options.map((o) => ({ value: o.id, label: o.label })),
                        ]}
                        value={
                            parentId === ""
                                ? { value: "", label: "(Root category)" }
                                : options
                                    .map((o) => ({ value: o.id, label: o.label }))
                                    .find((item) => item.value === parentId)
                        }
                        onChange={(e) => setParentId(e?.value ?? "")}
                    />

                    <select
                        className="border p-3 rounded-md w-full"
                        value={status ? "active" : "inactive"}
                        onChange={(e) => setStatus(e.target.value === "active")}
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>

                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md w-full font-semibold">
                        Save
                    </button>
                </form>
            </div>
        </div>
    );
}
