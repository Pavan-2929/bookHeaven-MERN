import React, { useEffect, useState } from "react";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { app } from "../firebase";
import { useSelector } from "react-redux";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

const UpdateListing = () => {
  const currentUser = useSelector((state) => state.currentUser);
  const navigate = useNavigate();
  const params = useParams();

  const [files, setFiles] = useState([]);
  const [formData, setFormData] = useState({
    imageUrls: [],
    name: "",
    description: "",
    address: "",
    type: "rent",
    bedrooms: 1,
    bathrooms: 1,
    regularPrice: 50,
    discountPrice: 0,
    offer: false,
    parking: false,
    furnished: false,
  });

  const [imageUploadError, setImageUploadError] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleImageSubmit = () => {
    if (files.length > 0 && files.length + formData.imageUrls.length < 7) {
      setImageLoading(true);
      const promises = [];

      for (let i = 0; i < files.length; i++) {
        promises.push(storeImage(files[i]));
      }

      Promise.all(promises)
        .then((urls) => {
          setFormData({
            ...formData,
            imageUrls: formData.imageUrls.concat(urls),
          });
          setImageUploadError(false);
          setImageLoading(false);
        })
        .catch((error) => {
          setImageUploadError("2 MB per image");
          setImageLoading(false);
        });
    } else {
      setImageUploadError("You can only upload 6 images");
      setImageLoading(false);
    }
  };

  const handleChange = (e) => {
    if (e.target.id === "sale" || e.target.id === "rent") {
      setFormData({ ...formData, type: e.target.id });
    }

    if (
      e.target.id === "parking" ||
      e.target.id === "furnished" ||
      e.target.id === "offer"
    ) {
      setFormData({ ...formData, [e.target.id]: e.target.checked });
    }

    if (
      e.target.type === "number" ||
      e.target.type === "text" ||
      e.target.type === "textarea"
    ) {
      setFormData({ ...formData, [e.target.id]: e.target.value });
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      if (formData.imageUrls.length < 1) {
        return setError("Upload atleast 1 Image");
      }

      if (formData.regularPrice < formData.discountPrice) {
        return setError("Discount price must be lower than regular price");
      }

      setError(false);
      setLoading(true);
      const response = await axios.post(
        `http://localhost:3000/api/listing/update/${params.id}`,
        {...formData, userRef:currentUser._id},
        { withCredentials: true }
      );
      console.log(response);

      setLoading(false);
      if (response.status !== 201) {
        setError(response.data.message);
      }
      toast.success("Updated Successfully", {
        style: {
          borderRadius: "10px",
          background: "#282828",
          color: "#fff",
        },
      });
      navigate(`/`);
    } catch (error) {
      setLoading(false);
      setError(error.message);
      console.log(error);
    }
  };

  const storeImage = async (file) => {
    return new Promise((resolve, reject) => {
      const storage = getStorage(app);
      const fileName = new Date().getTime() + file.name;
      const storageRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(progress);
        },
        (error) => {
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            resolve(downloadURL);
          });
        }
      );
    });
  };

  const handleDeleteImage = (index) => {
    setFormData({
      ...formData,
      imageUrls: formData.imageUrls.filter((_, i) => i !== index),
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const listing = await axios.get(
          `http://localhost:3000/api/listing/get/${params.id}`
        );
        if(listing.status === 200){
          setFormData(listing.data)
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
  }, []);

  const updateListing = async () => {
    try {
      const response = await axios.post(`http://localhost:3000/api/listing/update/${params.id}`, formData, {withCredentials:true})
      console.log(response);
    } catch (error) {
      console.log(error);
    }
  }
  return (
    <main className="sm:px-10 px-0 max-w-full mx-auto mt-5 ">
      <form
        className=" sm:flex-row gap-16 bg-[#282828] sm:p-10 p-4 rounded"
        onSubmit={handleUpdate}
      >
        <h1 className="text-4xl font-semibold text-center mb-8 ">
          Update a Listing
        </h1>
        <div className="flex flex-col sm:flex-row gap-16">
          <div className="flex flex-col gap-8 flex-1">
            <input
              type="text"
              placeholder="Name"
              className="border p-3 rounded-lg bg-[#414141]"
              id="name"
              maxLength="62"
              minLength="10"
              required
              onChange={handleChange}
              value={formData.name}
            />
            <textarea
              type="text"
              placeholder="Description"
              className="border p-3 rounded-lg bg-[#414141]"
              id="description"
              required
              onChange={handleChange}
              value={formData.description}
            />
            <input
              type="text"
              placeholder="Address"
              className="border p-3 rounded-lg bg-[#414141]"
              id="address"
              required
              onChange={handleChange}
              value={formData.address}
            />
            <div className="flex gap-8 my-6 flex-wrap">
              <div className="flex gap-2">
                <input
                  type="checkbox"
                  id="sale"
                  className="w-5 bg-[#414141]"
                  onChange={handleChange}
                  checked={formData.type === "sale"}
                />
                <span>Sell</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="checkbox"
                  id="rent"
                  className="w-5 bg-[#414141]"
                  onChange={handleChange}
                  checked={formData.type === "rent"}
                />
                <span>Rent</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="checkbox"
                  id="parking"
                  className="w-5 bg-[#414141]"
                  onChange={handleChange}
                  checked={formData.parking}
                />
                <span>Parking spot</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="checkbox"
                  id="furnished"
                  className="w-5 bg-[#414141]"
                  onChange={handleChange}
                  value={formData.furnished}
                />
                <span>Furnished</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="checkbox"
                  id="offer"
                  className="w-5 bg-[#414141]"
                  onChange={handleChange}
                  value={formData.offer}
                />
                <span>Offer</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  id="bedrooms"
                  min="1"
                  max="10"
                  required
                  className="p-2 border border-gray-300 rounded-lg bg-[#414141] text-sm"
                  onChange={handleChange}
                  value={formData.bedrooms}
                />
                <p className="text-sm">Beds</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  id="bathrooms"
                  min="1"
                  max="10"
                  required
                  className="p-2 border border-gray-300 rounded-lg bg-[#414141] text-sm"
                  onChange={handleChange}
                  value={formData.bathrooms}
                />
                <p>Baths</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  id="regularPrice"
                  min="50"
                  max="1000000"
                  required
                  className="p-2 border border-gray-300 rounded-lg bg-[#414141] text-sm"
                  onChange={handleChange}
                  value={formData.regularPrice}
                />
                <div className="flex flex-col items-center">
                  <p>Regular price</p>
                  <span className="text-xs">($ / month)</span>
                </div>
              </div>
              {formData.offer && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    id="discountPrice"
                    min="50"
                    max="1000000"
                    required
                    className="p-2 border border-gray-300 rounded-lg bg-[#414141] text-sm"
                    onChange={handleChange}
                    value={formData.discountPrice}
                  />
                  <div className="flex flex-col items-center">
                    <p>Discounted price</p>
                    <span className="text-xs">($ / month)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col flex-1 gap-4">
            <p className="font-semibold text-[#ccc]">
              Images:
              <span className="font-normal ml-2">
                The first image will be the cover (max 6)
              </span>
            </p>
            <div className="flex gap-4 items-center">
              <label
                htmlFor="images"
                className="flex-1 p-3 border border-gray-300 rounded cursor-pointer bg-[#414141] text-white text-center"
              >
                Select Photos ({files.length})
              </label>
              <input
                className="hidden"
                type="file"
                id="images"
                accept="image/*"
                multiple
                onChange={(e) => setFiles(e.target.files)}
              />
              <button
                onClick={handleImageSubmit}
                type="button"
                className="p-3 bg-green-800 border border-white rounded uppercase hover:bg-green-900 disabled:opacity-80"
              >
                {imageLoading ? "uploading..." : "upload"}
              </button>
            </div>

            <p className="text-red-500">
              {imageUploadError && imageUploadError}
            </p>
            <div className="flex flex-wrap justify-between">
              {formData.imageUrls.length > 0 &&
                formData.imageUrls.map((url, index) => (
                  <div
                    key={url}
                    className="flex justify-between p-2 border items-center mb-2 w-full sm:w-[45%] gap-5"
                  >
                    <img
                      src={url}
                      alt="listing image"
                      className="w-14 h-14 object-contain rounded-lg"
                    />
                    <button
                      type="button"
                      className="p-1 text-red-700 rounded-lg uppercase hover:opacity-75"
                      onClick={() => handleDeleteImage(index)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
            </div>

            <button
              disabled={loading || imageLoading}
              className="p-3 bg-purple-700 hover:bg-purple-800 text-white rounded-lg uppercase hover:opacity-95 disabled:opacity-60"
            >
              {loading ? "Updating..." : "Update Listing"}
            </button>
            {error && <p className="text-red-700 text-sm">{error}</p>}
          </div>
        </div>
      </form>
    </main>
  );
};

export default UpdateListing;
