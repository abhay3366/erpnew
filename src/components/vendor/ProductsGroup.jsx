"use client";

import { useEffect, useState } from "react";
import { MdDelete } from "react-icons/md";
import { FaEdit } from "react-icons/fa";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import Select from "react-select";
import FormHeader from "../common/FormHeader";
import { IoMdAdd } from "react-icons/io";

// ---------------- TREE FUNCTIONS ----------------
function removeNode(list, id) {
    return list
        .map((item) => {
            if (item.children?.length) {
                item.children = removeNode(item.children, id);
            }
            return item;
        })
        .filter((item) => item.id !== id);
}

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

function flattenTable(list, parentName = "—") {
    let rows = [];
    list.forEach((item) => {
        rows.push({
            id: item.id,
            name: item.name,
            slug: item.slug,
            parent: parentName,
            parentId: item.parentId || null,
            status: item.status,
        });

        if (item.children?.length)
            rows = rows.concat(flattenTable(item.children, item.name));
    });
    return rows;
}

// ---------------- COMPONENT ----------------
export default function ProductsGroup() {
    const [tree, setTree] = useState([]);
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [parentId, setParentId] = useState("");
    const [status, setStatus] = useState(true); // Active by default
    const [editId, setEditId] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [showTree, setShowTree] = useState(false);

    // load data
    const load = async () => {
        const res = await fetch("http://localhost:5001/categories");
        const data = await res.json();
        setTree(data.list);
    };

    useEffect(() => {
        load();
    }, []);

    const save = async (finalTree) => {
        await fetch("http://localhost:5001/categories", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ list: finalTree }),
        });

    };

    const onEdit = (row) => {
        setEditId(row.id);
        setName(row.name);
        setSlug(row.slug);
        setParentId(row.parentId || "");
        setStatus(row.status);
        setShowModal(true);
    };

    const deleteCategory = async (id) => {
        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
        }).then(async (result) => {
            if (result.isConfirmed) {
                // Perform deletion only after confirmation
                let newTree = removeNode(tree, id);
                await save(newTree); // your save function
                setTree(newTree);

                Swal.fire({
                    title: "Deleted!",
                    text: "Your Product Group has been deleted.",
                    icon: "success"
                });
            }
        });
    };

    const submit = async (e) => {
        e.preventDefault();

        let newTree = structuredClone(tree);

        if (editId) {
            newTree = removeNode(newTree, editId);
            const updated = {
                id: editId,
                name,
                slug,
                parentId: parentId ? Number(parentId) : null,
                status,
                children: [],
            };
            insertNode(newTree, updated.parentId, updated);
            await save(newTree);
            setTree(newTree);
            setEditId(null);
        } else {
            const node = {
                id: Date.now(),
                name,
                slug,
                parentId: parentId ? Number(parentId) : null,
                status,
                children: [],
            };
            newTree = removeNode(newTree, node.id);
            insertNode(newTree, node.parentId, node);
            await save(newTree);
            setTree(newTree);
        }

        setName("");
        setSlug("");
        setParentId("");
        setStatus(true);
        setShowModal(false);
        toast.success("Product Group Created")
    };

    const options = flatten(tree);
    const tableRows = flattenTable(tree);

    // render tree
    const renderTree = (list, depth = 0) => {
        return list?.map((i) => (
            <div key={i.id} className={`pl-${depth * 4} py-1`}>
                <div>{i.name}</div>
                {i.children?.length > 0 && renderTree(i.children, depth + 1)}
            </div>
        ));
    };

    return (
        <div className=" mx-auto p-6 space-y-6 ">
            <FormHeader title="Category" message="Manage your categories effectively" onback={"Back to Dashboard"} />
            {/* TABLE */}
            {!showTree && (
                <div className="bg-white p-3 rounded-xl border border-gray-200 mt-4 overflow-x-auto">

                    {/* BUTTONS */}
                    <div className="flex justify-between gap-4">
                        <div>
                            <h2 className="font-bold text-gray-700 mb-4">Product Group List</h2>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowModal(true)}
                                className="bg-brand-500 shadow-theme-xs hover:bg-brand-600 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition"
                            >
                                <IoMdAdd /> Add Product Group
                            </button>

                            <button
                                onClick={() => setShowTree(!showTree)}
                                className="bg-green-600 hover:bg-green-700 cursor-pointer text-white px-5 py-2 rounded-md shadow transition"
                            >
                                {showTree ? "Hide Tree" : "Show Tree"}
                            </button>
                        </div>
                    </div>

                    <span className="text-sm text-red-700 block mt-1">
                        * If you delete a parent product group, all child categories will be deleted automatically.
                    </span>

                    <table className="min-w-full border border-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="border p-3 text-left">Product Group</th>
                                <th className="border p-3 text-left">Slug</th>
                                <th className="border p-3 text-left">Parent</th>
                                <th className="border p-3 text-left">Status</th>
                                <th className="border p-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableRows.map((row) => (
                                <tr key={row.id} className={`row.status=="false"?"bg-red-500":" " hover:bg-gray-50`}>
                                    <td className="border p-3">{row.name}</td>
                                    <td className="border p-3">{row.slug}</td>
                                    <td className="border p-3">{row.parent}</td>
                                    <td
                                        className={`border p-3 font-semibold ${row.status ? "text-green-600" : "text-red-600"
                                            }`}
                                    >
                                        {row.status ? "Active" : "Inactive"}
                                    </td>
                                    <td className="border p-3 flex gap-2">
                                        <button
                                            onClick={() => onEdit(row)}
                                            className="bg-yellow-500 hidden cursor-pointer none hover:bg-yellow-600 text-white px-3 py-1 rounded-md transition"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => deleteCategory(row.id)}
                                            className="bg-red-600 cursor-pointer hover:bg-red-700 text-white px-3 py-1 rounded-md transition"
                                        >
                                            <MdDelete />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* TREE */}
            {showTree && (
                <div className="bg-white p-6 rounded-lg shadow-md mt-4">
                    <h3 className="font-semibold text-gray-700 mb-2">Product Group Tree</h3>
                    {renderTree(tree)}
                </div>
            )}

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-[9999]">

                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative animate-[zoomIn_0.2s_ease]">

                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl"
                        >
                            ✕
                        </button>

                        <h2 className="text-xl font-bold mb-4">
                            {editId ? "Edit Product Group" : "Add Product Group"}
                        </h2>

                        <form onSubmit={submit} className="space-y-4">

                            {/* Category Name */}
                            <input
                                className="inputCss"
                                placeholder="Product Group"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />

                            {/* Slug */}
                            <input
                                className="inputCss"
                                placeholder="Slug"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                            />

                            {/* Parent Category Dropdown */}
                            <Select
                                className="w-full"
                                classNamePrefix="react-select"
                                options={[
                                    { value: "", label: "(Root Product Group)" },
                                    ...options.map((o) => ({
                                        value: o.id,
                                        label: o.label,
                                    })),
                                ]}
                                value={
                                    parentId === ""
                                        ? { value: "", label: "(Root Product Group)" }
                                        : options
                                            .map((o) => ({ value: o.id, label: o.label }))
                                            .find((item) => item.value === parentId)
                                }
                                onChange={(e) => setParentId(e?.value ?? "")}
                            />

                            {/* Status Selector */}
                            <select
                                className="border border-gray-300 w-full p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={status ? "active" : "inactive"}
                                onChange={(e) =>
                                    setStatus(e.target.value === "active" ? true : false)
                                }
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>

                            {/* Button */}
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition w-full font-semibold">
                                {editId ? "Update" : "Save"}
                            </button>

                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
