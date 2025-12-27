"use client"
import React from 'react'
import { useForm } from 'react-hook-form'

const page = () => {
  const form=useForm();
  console.log("🚀 ~ page ~ form:", form)
  const  {register,control,handleSubmit}=form;
  console.log("🚀 ~ page ~ register:", register)
  console.log("🚀 ~ page ~ control:", control)
 
  const onSubmit=(data)=>{
    console.log("🚀 ~ onSubmit ~ data:", data)
  
  }

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input type='text' {...register("name",{required:true})} className='border-2' placeholder='enter a n ame' />
        <input type="text" {...register("lastname",{required:true})} className='border-2' placeholder='enter a last name' />
        <input type='submit' className='bg-amber-600 text-white p-2'/>
      </form>
    </div>
  )
}

export default page