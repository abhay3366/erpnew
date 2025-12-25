import Image from "next/image";
import React, { useEffect, useState } from "react";

const GridView = () => {
  const [resData, setResData] = useState([]);

  const fetchProducts = async () => {
    try {
      const res = await fetch("http://localhost:5001/products");
      const data = await res.json();
      setResData(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="grid grid-cols-3 ">
      {resData.map((product, index) => (
        <div key={index}>
          <div className="max-w-sm rounded overflow-hidden shadow-lg w-[350px] h-[250px]">
            <Image
              src={product.image}
              alt={product.productName}
              width={340}
              height={250}
              unoptimized
            />

            <div className=" pt-2 pb-2">
              <span className="inline-block   px-3  text-sm font-semibold text-gray-700 mr-2 mb-2">
                {product.productName}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GridView;
